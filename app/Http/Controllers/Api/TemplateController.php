<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TemplateRequest;
use App\Models\Template;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class TemplateController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Template::with('items')->orderBy('created_at')->orderBy('id')->get()->map(fn (Template $t) => $this->present($t))
        );
    }

    public function show(string $id): JsonResponse
    {
        return response()->json($this->present(Template::with('items')->findOrFail($id)));
    }

    /** Idempotent create-or-replace, so that offline changes can be safely replayed. */
    public function upsert(TemplateRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();

        $template = DB::transaction(function () use ($data, $id) {
            $template = Template::find($id) ?? new Template(['id' => $id]);
            if (! $template->exists && ! empty($data['created_at'])) {
                $template->created_at = $data['created_at'];
            }
            $template->name = $data['name'];
            $template->save();

            $template->items()->delete();
            foreach ($data['items'] as $item) {
                $template->items()->create([
                    'id' => $item['id'],
                    'parent_id' => $item['parent_id'] ?? null,
                    'label' => $item['label'],
                    'position' => $item['position'],
                ]);
            }

            return $template->load('items');
        });

        return response()->json($this->present($template));
    }

    public function destroy(string $id): Response
    {
        // Checklists keep living: their template_id is nulled by the database.
        Template::whereKey($id)->delete();

        return response()->noContent();
    }

    private function present(Template $template): array
    {
        return [
            'id' => $template->id,
            'name' => $template->name,
            'created_at' => $template->created_at?->toISOString(),
            'updated_at' => $template->updated_at?->toISOString(),
            'items' => $template->items->map(fn ($i) => [
                'id' => $i->id,
                'parent_id' => $i->parent_id,
                'label' => $i->label,
                'position' => $i->position,
            ])->values(),
        ];
    }
}
