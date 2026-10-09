<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ChecklistItem extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected $casts = [
        'position' => 'integer',
        'checked' => 'boolean',
        'disabled' => 'boolean',
    ];
}
