<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'nisn',
        'full_name',
        'gender',
        'grade',
        'is_archived',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
            'archived_at' => 'datetime',
        ];
    }

    public function studentAcademicYears(): HasMany
    {
        return $this->hasMany(StudentAcademicYear::class);
    }

    public function attendanceLogs(): HasMany
    {
        return $this->hasMany(AttendanceLog::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_archived', false);
    }

    public function scopeArchived($query)
    {
        return $query->where('is_archived', true);
    }
}
