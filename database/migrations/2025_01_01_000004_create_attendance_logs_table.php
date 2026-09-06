<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('scanned_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->date('attendance_date')->index();
            $table->time('scanned_at');
            $table->enum('status', ['HADIR', 'TERLAMBAT', 'REJECTED', 'DUPLICATE'])->index();
            $table->string('reject_reason', 255)->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'academic_year_id', 'attendance_date'], 'idx_attendance_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_logs');
    }
};
