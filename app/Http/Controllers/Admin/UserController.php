<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use App\Services\UserImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserController extends Controller
{
    public function __construct(protected UserImportService $importService) {}

    /**
     * Display list of users.
     */
    public function index(): Response
    {
        $users = User::orderBy('id', 'asc')
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role,
                    'role_label' => match ($u->role) {
                        'ADMIN' => 'Administrator',
                        'PETUGAS' => 'Petugas Piket',
                        'KEPALA' => 'Kepala Madrasah',
                        default => $u->role,
                    },
                    'assigned_classes' => $u->assigned_classes ?? [],
                    'is_active' => (bool) $u->is_active,
                    'created_at' => $u->created_at?->format('Y-m-d'),
                ];
            });

        $existingClasses = Student::select('grade')
            ->distinct()
            ->orderBy('grade')
            ->pluck('grade')
            ->toArray();

        $defaultClasses = [
            '7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '7.8', '7.9', '7.10',
            '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9', '8.10',
            '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7', '9.8', '9.9', '9.10',
            'VII-A', 'VII-B', 'VII-C', 'VIII-A', 'VIII-B', 'VIII-C', 'IX-A', 'IX-B', 'IX-C',
        ];

        $availableClasses = array_values(array_unique(array_merge($existingClasses, $defaultClasses)));

        return Inertia::render('Users/Index', [
            'usersList' => $users,
            'availableClasses' => $availableClasses,
        ]);
    }

    /**
     * Create a new user account.
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:191|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:ADMIN,PETUGAS,KEPALA',
            'assigned_classes' => 'nullable|array',
            'assigned_classes.*' => 'string',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'assigned_classes' => $validated['assigned_classes'] ?? null,
            'is_active' => true,
        ]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'data' => $user]);
        }

        return redirect()->back()->with('success', 'Akun pengguna berhasil ditambahkan.');
    }

    /**
     * Update an existing user account.
     */
    public function update(Request $request, User $user): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:100',
            'email' => ['required', 'email', 'max:191', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role' => 'required|in:ADMIN,PETUGAS,KEPALA',
            'assigned_classes' => 'nullable|array',
            'assigned_classes.*' => 'string',
            'is_active' => 'nullable|boolean',
        ]);

        // Protect last active administrator from demotion or deactivation
        $isDemotingOrDeactivating = ($user->isAdmin() && $validated['role'] !== 'ADMIN') ||
            ($user->is_active && isset($validated['is_active']) && ! $validated['is_active']);

        if ($user->isAdmin() && $isDemotingOrDeactivating && User::where('role', 'ADMIN')->where('is_active', true)->count() <= 1) {
            return redirect()->back()->withErrors(['error' => 'Tidak dapat mengubah peran atau menonaktifkan administrator terakhir.']);
        }

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'assigned_classes' => $validated['role'] === 'PETUGAS' ? ($validated['assigned_classes'] ?? null) : null,
        ];

        if (array_key_exists('is_active', $validated) && $validated['is_active'] !== null) {
            $updateData['is_active'] = (bool) $validated['is_active'];
        }

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'data' => $user]);
        }

        return redirect()->back()->with('success', 'Data pengguna berhasil diperbarui.');
    }

    /**
     * Toggle user active status.
     */
    public function toggleStatus(Request $request, User $user): RedirectResponse|JsonResponse
    {
        // Protect self-deactivation if last admin
        if ($user->isAdmin() && User::where('role', 'ADMIN')->where('is_active', true)->count() <= 1 && $user->is_active) {
            return redirect()->back()->withErrors(['error' => 'Tidak dapat menonaktifkan administrator terakhir.']);
        }

        $user->update(['is_active' => ! $user->is_active]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'is_active' => $user->is_active]);
        }

        return redirect()->back()->with('success', 'Status akun pengguna berhasil diubah.');
    }

    /**
     * Parse and validate uploaded Excel file for users.
     */
    public function validateImport(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:5120',
        ]);

        $file = $request->file('file');
        $result = $this->importService->parseAndValidate($file);

        return response()->json($result);
    }

    /**
     * Execute and save imported users.
     */
    public function storeImport(Request $request): JsonResponse|RedirectResponse
    {
        $request->validate([
            'valid_data' => 'required|array|min:1',
            'valid_data.*.name' => 'required|string|min:3',
            'valid_data.*.email' => 'required|email',
            'valid_data.*.role' => 'required|in:ADMIN,PETUGAS,KEPALA',
            'valid_data.*.password' => 'required|string|min:8',
            'valid_data.*.assigned_classes' => 'nullable|array',
        ]);

        $validData = $request->input('valid_data');
        $result = $this->importService->executeImport($validData);

        if ($request->wantsJson()) {
            return response()->json($result);
        }

        return redirect()->route('admin.users.index')->with('success', $result['message']);
    }

    /**
     * Download the official Excel import template for users.
     */
    public function downloadTemplate(): StreamedResponse
    {
        return $this->importService->downloadTemplate();
    }
}
