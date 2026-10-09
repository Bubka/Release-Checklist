<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChecklistRequest;
use App\Models\Checklist;
use App\Models\Template;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ChecklistController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Checklist::with('items')->orderBy('created_at')->orderBy('id')->get()->map(fn (Checklist $c) => $this->present($c))
        );
    }

    public function show(string $id): JsonResponse
    {
        return response()->json($this->present(Checklist::with('items')->findOrFail($id)));
    }

    /** Idempotent create-or-replace, so that offline changes can be safely replayed. */
    public function upsert(ChecklistRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();

        $checklist = DB::transaction(function () use ($data, $id) {
            $checklist = Checklist::find($id) ?? new Checklist(['id' => $id]);
            if (! $checklist->exists && ! empty($data['created_at'])) {
                $checklist->created_at = $data['created_at'];
            }
            $checklist->name = $data['name'];
            $checklist->version = $data['version'];
            // The template may have been deleted meanwhile; the checklist is standalone anyway.
            $templateId = $data['template_id'] ?? null;
            $checklist->template_id = $templateId && Template::whereKey($templateId)->exists() ? $templateId : null;
            $checklist->save();

            $checklist->items()->delete();
            foreach ($data['items'] as $item) {
                $checklist->items()->create([
                    'id' => $item['id'],
                    'parent_id' => $item['parent_id'] ?? null,
                    'label' => $item['label'],
                    'position' => $item['position'],
                    'checked' => $item['checked'],
                    'disabled' => $item['disabled'],
                ]);
            }

            return $checklist->load('items');
        });

        return response()->json($this->present($checklist));
    }

    public function destroy(string $id): Response
    {
        Checklist::whereKey($id)->delete();

        return response()->noContent();
    }

    private function present(Checklist $checklist): array
    {
        return [
            'id' => $checklist->id,
            'name' => $checklist->name,
            'version' => $checklist->version,
            'template_id' => $checklist->template_id,
            'created_at' => $checklist->created_at?->toISOString(),
            'updated_at' => $checklist->updated_at?->toISOString(),
            'items' => $checklist->items->map(fn ($i) => [
                'id' => $i->id,
                'parent_id' => $i->parent_id,
                'label' => $i->label,
                'position' => $i->position,
                'checked' => $i->checked,
                'disabled' => $i->disabled,
            ])->values(),
        ];
    }
}
