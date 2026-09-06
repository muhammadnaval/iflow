import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import {
    Users,
    UserPlus,
    FileSpreadsheet,
    Download,
    UploadCloud,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Shield,
    QrCode,
    Award,
    Search,
    RefreshCw,
    X,
    BookOpen,
    Pencil
} from 'lucide-react';

const DEFAULT_AVAILABLE_CLASSES = [
    '7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '7.8', '7.9', '7.10',
    '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9', '8.10',
    '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7', '9.8', '9.9', '9.10',
    'VII-A', 'VII-B', 'VII-C', 'VIII-A', 'VIII-B', 'VIII-C', 'IX-A', 'IX-B', 'IX-C'
];

export default function UsersIndex({ auth, usersList = [], availableClasses }) {
    const classList = availableClasses && availableClasses.length > 0 ? availableClasses : DEFAULT_AVAILABLE_CLASSES;
    const [searchQuery, setSearchQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    
    // Create Form state
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formRole, setFormRole] = useState('PETUGAS');
    const [formPassword, setFormPassword] = useState('');
    const [formAssignedClasses, setFormAssignedClasses] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit Form state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editFormName, setEditFormName] = useState('');
    const [editFormEmail, setEditFormEmail] = useState('');
    const [editFormRole, setEditFormRole] = useState('PETUGAS');
    const [editFormPassword, setEditFormPassword] = useState('');
    const [editFormAssignedClasses, setEditFormAssignedClasses] = useState([]);
    const [editFormIsActive, setEditFormIsActive] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editError, setEditError] = useState(null);

    // Import Modal state
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [importError, setImportError] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    const filteredUsers = usersList.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleStatus = (id) => {
        router.post(route('admin.users.toggle', id), {}, {
            preserveScroll: true,
        });
    };

    const handleCreateUser = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(route('admin.users.store'), {
            name: formName,
            email: formEmail,
            role: formRole,
            password: formPassword,
            assigned_classes: formRole === 'PETUGAS' && formAssignedClasses.length > 0 ? formAssignedClasses : null,
        }, {
            onSuccess: () => {
                setModalOpen(false);
                setFormName('');
                setFormEmail('');
                setFormRole('PETUGAS');
                setFormPassword('');
                setFormAssignedClasses([]);
                setSuccessMessage('Akun pengguna baru berhasil ditambahkan.');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const openEditModal = (user) => {
        setEditingUserId(user.id);
        setEditFormName(user.name);
        setEditFormEmail(user.email);
        setEditFormRole(user.role);
        setEditFormPassword('');
        setEditFormAssignedClasses(user.assigned_classes || []);
        setEditFormIsActive(Boolean(user.is_active));
        setEditError(null);
        setEditModalOpen(true);
    };

    const handleUpdateUser = (e) => {
        e.preventDefault();
        if (!editingUserId) return;

        setIsUpdating(true);
        setEditError(null);

        router.put(route('admin.users.update', editingUserId), {
            name: editFormName,
            email: editFormEmail,
            role: editFormRole,
            password: editFormPassword || null,
            assigned_classes: editFormRole === 'PETUGAS' && editFormAssignedClasses.length > 0 ? editFormAssignedClasses : null,
            is_active: editFormIsActive,
        }, {
            onSuccess: () => {
                setEditModalOpen(false);
                setSuccessMessage('Data pengguna berhasil diperbarui.');
            },
            onError: (errors) => {
                const msg = errors.error || Object.values(errors)[0] || 'Gagal memperbarui data pengguna.';
                setEditError(msg);
            },
            onFinish: () => setIsUpdating(false),
        });
    };

    // Handle user Excel validation
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setIsValidating(true);
        setImportError(null);
        setValidationResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(route('admin.users.import.validate'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setValidationResult(response.data);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.file?.[0] || 'Gagal memproses berkas Excel.';
            setImportError(msg);
        } finally {
            setIsValidating(false);
        }
    };

    // Execute User Import
    const handleExecuteImport = async () => {
        if (!validationResult || !validationResult.valid_data || validationResult.valid_data.length === 0) return;

        setIsImporting(true);
        try {
            const response = await axios.post(route('admin.users.import.store'), {
                valid_data: validationResult.valid_data,
            });

            setSuccessMessage(response.data.message || 'Data pengguna berhasil diimpor!');
            setImportModalOpen(false);
            setSelectedFile(null);
            setValidationResult(null);

            // Reload Inertia data
            router.reload({ preserveScroll: true });
        } catch (err) {
            const msg = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data impor.';
            setImportError(msg);
        } finally {
            setIsImporting(false);
        }
    };

    const handleDownloadTemplate = () => {
        window.location.href = route('admin.users.import.template');
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-madrasah-fg tracking-tight">
                            Manajemen Pengguna & Petugas Piket
                        </h1>
                        <p className="text-xs text-madrasah-muted mt-0.5">
                            Kelola akun petugas pemindai presensi, administrator, pembagian kelas piket, dan kepala madrasah
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setImportModalOpen(true);
                                setValidationResult(null);
                                setImportError(null);
                                setSelectedFile(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Import Excel</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold shadow-xs transition"
                        >
                            <UserPlus className="w-4 h-4 text-brand-accent" />
                            <span>Tambah Akun</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Manajemen Pengguna - I-FLOW" />

            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Alert Notification */}
                {successMessage && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900 flex items-center justify-between animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>{successMessage}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSuccessMessage(null)}
                            className="text-emerald-700 hover:text-emerald-900"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Search Bar */}
                <div className="bg-white border border-madrasah-border rounded-xl p-4 shadow-2xs flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama pengguna atau email..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border-madrasah-border focus:ring-brand-primary"
                        />
                    </div>
                    <span className="text-xs text-madrasah-muted font-medium">
                        Total {filteredUsers.length} akun terdaftar
                    </span>
                </div>

                {/* Users Table */}
                <div className="bg-white border border-madrasah-border rounded-xl shadow-2xs overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-stone-50 border-b border-madrasah-border text-madrasah-muted uppercase font-bold text-[10px] tracking-wider">
                            <tr>
                                <th className="py-3 px-4">Nama & Email</th>
                                <th className="py-3 px-4">Peran (Role)</th>
                                <th className="py-3 px-4">Tugas Kelas</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4">Terdaftar</th>
                                <th className="py-3 px-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-madrasah-border/60">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-madrasah-muted">
                                        Tidak ada akun pengguna yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isCurrentAuth = auth?.user?.id === user.id;

                                    return (
                                        <tr key={user.id} className="hover:bg-stone-50 transition">
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-madrasah-fg text-sm">{user.name}</div>
                                                <div className="text-[11px] text-stone-500 font-mono">{user.email}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                    user.role === 'ADMIN'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : user.role === 'KEPALA'
                                                        ? 'bg-amber-100 text-amber-900'
                                                        : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                    {user.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                                                    {user.role === 'KEPALA' && <Award className="w-3 h-3" />}
                                                    {user.role === 'PETUGAS' && <QrCode className="w-3 h-3" />}
                                                    <span>{user.role_label}</span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {user.role === 'ADMIN' ? (
                                                    <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                                                        Semua Kelas (Admin Bypass)
                                                    </span>
                                                ) : user.assigned_classes && user.assigned_classes.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {user.assigned_classes.map((cls) => (
                                                            <span
                                                                key={cls}
                                                                className="text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded"
                                                            >
                                                                {cls}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="inline-block text-[10px] font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded">
                                                        Semua Kelas
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    user.is_active
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-stone-100 text-stone-500 border border-stone-200'
                                                }`}>
                                                    {user.is_active ? 'AKTIF' : 'NONAKTIF'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">
                                                {user.created_at || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(user)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-brand-primary hover:bg-brand-50 border border-brand-200 transition"
                                                        title="Edit Data Pengguna"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        <span>Edit</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isCurrentAuth}
                                                        onClick={() => toggleStatus(user.id)}
                                                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                                                            isCurrentAuth
                                                                ? 'opacity-40 cursor-not-allowed bg-stone-100 text-stone-400'
                                                                : user.is_active
                                                                ? 'text-rose-700 hover:bg-rose-50 border border-rose-200'
                                                                : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                                                        }`}
                                                    >
                                                        {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Manual Create User */}
            {modalOpen && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-madrasah-border my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                            <h2 className="text-base font-bold text-madrasah-fg">
                                Tambah Akun Pengguna Baru
                            </h2>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Nama Lengkap & Gelar:
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Contoh: Ustadz Ahmad, S.Pd.I"
                                    className="w-full text-xs rounded-lg border-stone-300 focus:ring-brand-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Email Madrasah:
                                </label>
                                <input
                                    type="email"
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    placeholder="nama@mtsn3padang.sch.id"
                                    className="w-full text-xs rounded-lg border-stone-300 focus:ring-brand-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Peran (Hak Akses):
                                </label>
                                <select
                                    value={formRole}
                                    onChange={(e) => setFormRole(e.target.value)}
                                    className="w-full text-xs rounded-lg border-stone-300 focus:ring-brand-primary"
                                >
                                    <option value="PETUGAS">PETUGAS (Scan Presensi & Dashboard)</option>
                                    <option value="KEPALA">KEPALA MADRASAH (Dashboard & Laporan)</option>
                                    <option value="ADMIN">ADMIN (Akses Penuh Seluruh Sistem)</option>
                                </select>
                            </div>

                            {/* Class Assignment for Officers */}
                            {formRole === 'PETUGAS' && (
                                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                                            <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
                                            <span>Penugasan Kelas (Opsional)</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setFormAssignedClasses(
                                                formAssignedClasses.length === classList.length ? [] : [...classList]
                                            )}
                                            className="text-[10px] font-bold text-brand-primary hover:underline"
                                        >
                                            {formAssignedClasses.length === classList.length ? 'Kosongkan' : 'Pilih Semua'}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-stone-500">
                                        Pilih kelas yang boleh dipindai oleh petugas ini. Jika dikosongkan, petugas dapat memindai semua kelas.
                                    </p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pt-1 max-h-48 overflow-y-auto p-1 border border-stone-200 rounded-lg">
                                        {classList.map((cls) => {
                                            const isChecked = formAssignedClasses.includes(cls);
                                            return (
                                                <label
                                                    key={cls}
                                                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs font-mono cursor-pointer transition ${
                                                        isChecked
                                                            ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800'
                                                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormAssignedClasses([...formAssignedClasses, cls]);
                                                            } else {
                                                                setFormAssignedClasses(formAssignedClasses.filter((c) => c !== cls));
                                                            }
                                                        }}
                                                        className="rounded border-stone-300 text-brand-primary focus:ring-brand-primary h-3.5 w-3.5"
                                                    />
                                                    <span>{cls}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Kata Sandi:
                                </label>
                                <input
                                    type="password"
                                    value={formPassword}
                                    onChange={(e) => setFormPassword(e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    className="w-full text-xs rounded-lg border-stone-300 focus:ring-brand-primary"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-secondary"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit User */}
            {editModalOpen && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-madrasah-border my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-brand-50 text-brand-primary">
                                    <Pencil className="w-4 h-4" />
                                </div>
                                <h2 className="text-base font-bold text-madrasah-fg">
                                    Edit Data Pengguna & Petugas
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditModalOpen(false)}
                                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {editError && (
                            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{editError}</span>
                            </div>
                        )}

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Nama Lengkap & Gelar:
                                </label>
                                <input
                                    type="text"
                                    value={editFormName}
                                    onChange={(e) => setEditFormName(e.target.value)}
                                    placeholder="Nama pengguna..."
                                    className="w-full text-xs rounded-lg border-stone-300 focus:ring-brand-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Email Madrasah:
                                </label>
                                <input
                                    type="email"
                                    value={editFormEmail}
                                    onChange={(e) => setEditFormEmail(e.target.value)}
                                    placeholder="nama@mtsn3padang.sch.id"
                                    className="w-full text-xs rounded-lg border-stone-300 focus:ring-brand-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Peran (Hak Akses):
                                </label>
                                <select
                                    value={editFormRole}
                                    onChange={(e) => setEditFormRole(e.target.value)}
                                    className="w-full text-xs rounded-lg border-stone-300 focus:ring-brand-primary"
                                >
                                    <option value="PETUGAS">PETUGAS (Scan Presensi & Dashboard)</option>
                                    <option value="KEPALA">KEPALA MADRASAH (Dashboard & Laporan)</option>
                                    <option value="ADMIN">ADMIN (Akses Penuh Seluruh Sistem)</option>
                                </select>
                            </div>

                            {/* Class Assignment for Officers */}
                            {editFormRole === 'PETUGAS' && (
                                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                                            <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
                                            <span>Penugasan Kelas (Opsional)</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setEditFormAssignedClasses(
                                                editFormAssignedClasses.length === classList.length ? [] : [...classList]
                                            )}
                                            className="text-[10px] font-bold text-brand-primary hover:underline"
                                        >
                                            {editFormAssignedClasses.length === classList.length ? 'Kosongkan' : 'Pilih Semua'}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-stone-500">
                                        Pilih kelas yang boleh dipindai oleh petugas ini. Jika dikosongkan, petugas dapat memindai semua kelas.
                                    </p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pt-1 max-h-48 overflow-y-auto p-1 border border-stone-200 rounded-lg">
                                        {classList.map((cls) => {
                                            const isChecked = editFormAssignedClasses.includes(cls);
                                            return (
                                                <label
                                                    key={cls}
                                                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs font-mono cursor-pointer transition ${
                                                        isChecked
                                                            ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800'
                                                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setEditFormAssignedClasses([...editFormAssignedClasses, cls]);
                                                            } else {
                                                                setEditFormAssignedClasses(editFormAssignedClasses.filter((c) => c !== cls));
                                                            }
                                                        }}
                                                        className="rounded border-stone-300 text-brand-primary focus:ring-brand-primary h-3.5 w-3.5"
                                                    />
                                                    <span>{cls}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    Kata Sandi Baru (Opsional):
                                </label>
                                <input
                                    type="password"
                                    value={editFormPassword}
                                    onChange={(e) => setEditFormPassword(e.target.value)}
                                    placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                                    className="w-full text-xs rounded-lg border-stone-300 focus:ring-brand-primary"
                                />
                                <span className="text-[11px] text-stone-400 mt-1 block">
                                    * Biarkan kosong jika pengguna tetap menggunakan kata sandi saat ini.
                                </span>
                            </div>

                            <div className="pt-2 border-t border-stone-100">
                                <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editFormIsActive}
                                        onChange={(e) => setEditFormIsActive(e.target.checked)}
                                        className="rounded border-stone-300 text-brand-primary focus:ring-brand-primary h-4 w-4"
                                    />
                                    <span>Akun Aktif (Dapat login dan memindai presensi)</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-secondary inline-flex items-center gap-1.5"
                                >
                                    {isUpdating ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <span>Simpan Perubahan</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Import Excel Pengguna */}
            {importModalOpen && (
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-madrasah-border overflow-hidden animate-in fade-in my-8">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-madrasah-border bg-stone-50 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                                    <FileSpreadsheet className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-madrasah-fg">
                                        Import Akun Pengguna & Petugas dari Excel
                                    </h2>
                                    <p className="text-xs text-madrasah-muted">
                                        Unggah berkas spreadsheet (.xlsx/.xls) dengan format kolom resmi
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setImportModalOpen(false)}
                                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            {/* Download Template Bar */}
                            <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-bold text-brand-primary flex items-center gap-1.5">
                                        <span>Gunakan Template Resmi MTsN 3 Kota Padang</span>
                                    </div>
                                    <p className="text-[11px] text-stone-600 mt-0.5">
                                        Format kolom: <b>NAMA</b>, <b>EMAIL</b>, <b>ROLE</b>, <b>PASSWORD</b>, dan <b>KELAS</b> (Opsional, contoh: VII-A, VII-B).
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white text-xs font-bold shadow-2xs transition shrink-0"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Unduh Template (.xlsx)</span>
                                </button>
                            </div>

                            {/* Error Alert */}
                            {importError && (
                                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                    <span>{importError}</span>
                                </div>
                            )}

                            {/* Dropzone / Upload area */}
                            {!validationResult && (
                                <div className="border-2 border-dashed border-stone-300 hover:border-brand-primary rounded-xl p-8 text-center transition bg-stone-50/50">
                                    <UploadCloud className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                                    <div className="text-xs font-bold text-stone-700">
                                        Pilih atau seret berkas Excel ke sini
                                    </div>
                                    <p className="text-[11px] text-stone-500 mt-1 mb-4">
                                        Mendukung format .xlsx atau .xls (Maks. 5 MB)
                                    </p>

                                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold shadow-xs cursor-pointer transition">
                                        {isValidating ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Memvalidasi Berkas...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FileSpreadsheet className="w-4 h-4" />
                                                <span>Pilih Berkas Excel</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            onChange={handleFileSelect}
                                            disabled={isValidating}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            )}

                            {/* Validation Result Preview */}
                            {validationResult && (
                                <div className="space-y-4">
                                    {/* Stats KPI */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-center">
                                            <div className="text-[10px] uppercase font-bold text-stone-500">Total Baris</div>
                                            <div className="font-mono text-lg font-bold text-stone-800">{validationResult.total_rows}</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                                            <div className="text-[10px] uppercase font-bold text-emerald-700">Baris Valid</div>
                                            <div className="font-mono text-lg font-bold text-emerald-800">{validationResult.valid_rows}</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-center">
                                            <div className="text-[10px] uppercase font-bold text-rose-700">Baris Error</div>
                                            <div className="font-mono text-lg font-bold text-rose-800">{validationResult.error_rows}</div>
                                        </div>
                                    </div>

                                    {/* Error Details */}
                                    {validationResult.errors && validationResult.errors.length > 0 && (
                                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1.5 max-h-36 overflow-y-auto">
                                            <div className="font-bold text-rose-900 flex items-center gap-1.5">
                                                <XCircle className="w-4 h-4 text-rose-600" />
                                                <span>Ditemukan {validationResult.errors.length} baris tidak valid:</span>
                                            </div>
                                            {validationResult.errors.map((err, idx) => (
                                                <div key={idx} className="text-[11px] text-rose-700 pl-5">
                                                    • <b>Baris {err.row}</b> ({err.name} / {err.email}): {err.reason}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Preview Table */}
                                    <div className="border border-madrasah-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                        <table className="w-full text-left text-[11px]">
                                            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold sticky top-0">
                                                <tr>
                                                    <th className="py-2 px-3">Baris</th>
                                                    <th className="py-2 px-3">Nama Lengkap</th>
                                                    <th className="py-2 px-3">Email</th>
                                                    <th className="py-2 px-3">Peran</th>
                                                    <th className="py-2 px-3">Tugas Kelas</th>
                                                    <th className="py-2 px-3 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100">
                                                {validationResult.preview_rows.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-stone-50">
                                                        <td className="py-1.5 px-3 font-mono text-stone-400">{row.row}</td>
                                                        <td className="py-1.5 px-3 font-semibold text-stone-800">{row.name}</td>
                                                        <td className="py-1.5 px-3 font-mono text-stone-600">{row.email}</td>
                                                        <td className="py-1.5 px-3">
                                                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                                                                {row.role}
                                                            </span>
                                                        </td>
                                                        <td className="py-1.5 px-3 font-mono text-stone-600 text-[10px]">
                                                            {row.assigned_classes || 'Semua Kelas'}
                                                        </td>
                                                        <td className="py-1.5 px-3 text-center">
                                                            {row.status === 'VALID' ? (
                                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                                    Valid
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                                                    Gagal
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-madrasah-border bg-stone-50 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    setValidationResult(null);
                                    setSelectedFile(null);
                                    setImportError(null);
                                    if (!validationResult) setImportModalOpen(false);
                                }}
                                className="px-3.5 py-2 rounded-lg border border-stone-300 hover:bg-white text-xs font-semibold text-stone-700 transition"
                            >
                                {validationResult ? 'Unggah Berkas Lain' : 'Batal'}
                            </button>

                            {validationResult && (
                                <button
                                    type="button"
                                    disabled={isImporting || validationResult.valid_rows === 0}
                                    onClick={handleExecuteImport}
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-bold transition shadow-xs ${
                                        validationResult.valid_rows > 0
                                            ? 'bg-emerald-700 hover:bg-emerald-800'
                                            : 'bg-stone-400 cursor-not-allowed'
                                    }`}
                                >
                                    {isImporting ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Menyimpan ke Database...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Simpan {validationResult.valid_rows} Pengguna Sekarang</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
