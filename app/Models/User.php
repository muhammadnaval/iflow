<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role', 'assigned_classes', 'is_active'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'assigned_classes' => 'array',
        ];
    }

    /**
     * Attendance logs scanned by this user/officer.
     */
    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class, 'scanned_by_user_id');
    }

    public function isAdmin(): bool
    {
        return strtoupper($this->role) === 'ADMIN';
    }

    public function isPetugas(): bool
    {
        return strtoupper($this->role) === 'PETUGAS';
    }

    public function isKepala(): bool
    {
        return strtoupper($this->role) === 'KEPALA';
    }

    /**
     * Check whether this user/officer is authorized to scan a specific student grade/class.
     */
    public function canScanClass(string $grade): bool
    {
        // Administrator has bypass permission to scan all classes
        if ($this->isAdmin()) {
            return true;
        }

        // If no specific class restriction assigned or explicitly set to ALL, allow all
        if (empty($this->assigned_classes) || in_array('ALL', $this->assigned_classes, true)) {
            return true;
        }

        return in_array($grade, $this->assigned_classes, true);
    }
}
