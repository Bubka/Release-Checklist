<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Base request for documents (templates, checklists) carrying a flat list of
 * items that together describe a tree through their `parent_id`.
 */
abstract class ItemTreeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['id' => $this->route('id')]);
    }

    /** @return array<string, mixed> */
    protected function baseRules(): array
    {
        return [
            'id' => ['required', 'uuid'],
            'name' => ['required', 'string', 'max:255'],
            'created_at' => ['nullable', 'date'],
            'items' => ['present', 'array', 'max:5000'],
            'items.*.id' => ['required', 'uuid', 'distinct'],
            'items.*.parent_id' => ['nullable', 'uuid'],
            'items.*.label' => ['required', 'string', 'max:500'],
            'items.*.position' => ['required', 'integer', 'min:0'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            $items = $this->input('items');
            if ($validator->errors()->isNotEmpty() || ! is_array($items)) {
                return;
            }

            $parents = [];
            foreach ($items as $item) {
                $parents[$item['id']] = $item['parent_id'] ?? null;
            }

            foreach ($parents as $id => $parent) {
                if ($parent !== null && ! array_key_exists($parent, $parents)) {
                    $validator->errors()->add('items', "Item {$id} references an unknown parent.");

                    return;
                }
                $seen = [$id => true];
                while ($parent !== null) {
                    if (isset($seen[$parent])) {
                        $validator->errors()->add('items', "Item {$id} is part of a cycle.");

                        return;
                    }
                    $seen[$parent] = true;
                    $parent = $parents[$parent];
                }
            }
        }];
    }
}
