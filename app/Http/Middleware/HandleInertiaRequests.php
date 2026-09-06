<?php

namespace App\Http\Middleware;

use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'assigned_classes' => $user->assigned_classes ?? [],
                ] : null,
            ],
            'activeAcademicYear' => function () {
                try {
                    $active = AcademicYear::active()->first();
                    if (! $active) {
                        return null;
                    }

                    return [
                        'id' => $active->id,
                        'name' => $active->name,
                        'presence_start_time' => substr((string) $active->presence_start_time, 0, 5),
                        'presence_end_time' => substr((string) $active->presence_end_time, 0, 5),
                        'late_tolerance_minutes' => (int) $active->late_tolerance_minutes,
                    ];
                } catch (\Throwable) {
                    return null;
                }
            },
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
