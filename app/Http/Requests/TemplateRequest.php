<?php

namespace App\Http\Requests;

class TemplateRequest extends ItemTreeRequest
{
    public function rules(): array
    {
        return $this->baseRules();
    }
}
