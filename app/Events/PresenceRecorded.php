<?php

namespace App\Events;

use App\Models\AttendanceLog;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PresenceRecorded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $scanData;

    /**
     * Create a new event instance.
     */
    public function __construct(public AttendanceLog $attendanceLog)
    {
        $attendanceLog->load(['student', 'scannedByUser']);

        $this->scanData = [
            'id' => $attendanceLog->id,
            'student_id' => $attendanceLog->student_id,
            'student_name' => $attendanceLog->student?->full_name,
            'nisn' => $attendanceLog->student?->nisn,
            'class' => $attendanceLog->student?->grade,
            'gender' => $attendanceLog->student?->gender,
            'status' => $attendanceLog->status,
            'scanned_at' => is_string($attendanceLog->scanned_at) ? $attendanceLog->scanned_at : date('H:i:s', strtotime($attendanceLog->scanned_at)),
            'scanned_by' => $attendanceLog->scannedByUser?->name ?? 'Petugas Piket',
            'reject_reason' => $attendanceLog->reject_reason,
            'attendance_date' => $attendanceLog->attendance_date?->format('Y-m-d') ?? date('Y-m-d'),
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('presence.dashboard'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'PresenceRecorded';
    }
}
