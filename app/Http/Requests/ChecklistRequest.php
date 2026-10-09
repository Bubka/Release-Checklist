<?php

namespace App\Http\Requests;

class ChecklistRequest extends ItemTreeRequest
{
    public function rules(): array
    {
        return $this->baseRules() + [
            'version' => ['required', 'string', 'max:100'],
            'template_id' => ['nullable', 'uuid'],
            'items.*.checked' => ['required', 'boolean'],
            'items.*.disabled' => ['required', 'boolean'],
        ];
    }
}
