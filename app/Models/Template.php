<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Template extends Model
{
    use HasUuids;

    protected $guarded = [];

    public function items(): HasMany
    {
        return $this->hasMany(TemplateItem::class)->orderBy('position');
    }
}
