<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class AcademicYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'is_active',
        'presence_start_time',
        'presence_end_time',
        'late_tolerance_minutes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_active' => 'boolean',
            'late_tolerance_minutes' => 'integer',
        ];
    }

    public function studentAcademicYears(): HasMany
    {
        return $this->hasMany(StudentAcademicYear::class);
    }

    public function students(): HasManyThrough
    {
        return $this->hasManyThrough(
            Student::class,
            StudentAcademicYear::class,
            'academic_year_id',
            'id',
            'id',
            'student_id'
        );
    }

    public function attendanceLogs(): HasMany
    {
        return $this->hasMany(AttendanceLog::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
