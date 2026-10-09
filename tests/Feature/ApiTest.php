<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    private function templatePayload(array $overrides = []): array
    {
        $section = (string) Str::uuid();

        return array_merge([
            'name' => 'Release',
            'items' => [
                ['id' => $section, 'parent_id' => null, 'label' => 'Build', 'position' => 0],
                ['id' => (string) Str::uuid(), 'parent_id' => $section, 'label' => 'Tests green', 'position' => 0],
                ['id' => (string) Str::uuid(), 'parent_id' => null, 'label' => 'Changelog', 'position' => 1],
            ],
        ], $overrides);
    }

    private function checklistPayload(?string $templateId, array $items): array
    {
        return ['name' => 'v1', 'version' => '1.0.0', 'template_id' => $templateId, 'items' => $items];
    }

    public function test_template_crud_and_replay(): void
    {
        $id = (string) Str::uuid();
        $payload = $this->templatePayload();

        $this->putJson("/api/templates/$id", $payload)->assertOk()->assertJsonCount(3, 'items');
        $this->putJson("/api/templates/$id", $payload)->assertOk();
        $this->getJson('/api/templates')->assertOk()->assertJsonCount(1)->assertJsonPath('0.items.1.parent_id', $payload['items'][0]['id']);

        $payload['name'] = 'Renamed';
        $payload['items'] = array_slice($payload['items'], 2);
        $payload['items'][0]['parent_id'] = null;
        $this->putJson("/api/templates/$id", $payload)->assertOk()->assertJsonPath('name', 'Renamed')->assertJsonCount(1, 'items');

        $this->deleteJson("/api/templates/$id")->assertNoContent();
        $this->getJson("/api/templates/$id")->assertNotFound();
    }

    public function test_template_validation(): void
    {
        $id = (string) Str::uuid();
        $this->putJson("/api/templates/$id", $this->templatePayload(['name' => '']))->assertUnprocessable();

        $payload = $this->templatePayload();
        $payload['items'][2]['parent_id'] = (string) Str::uuid();
        $this->putJson("/api/templates/$id", $payload)->assertUnprocessable();

        $a = (string) Str::uuid();
        $b = (string) Str::uuid();
        $this->putJson("/api/templates/$id", ['name' => 'x', 'items' => [
            ['id' => $a, 'parent_id' => $b, 'label' => 'a', 'position' => 0],
            ['id' => $b, 'parent_id' => $a, 'label' => 'b', 'position' => 0],
        ]])->assertUnprocessable();
    }

    public function test_deleting_template_keeps_checklists(): void
    {
        $templateId = (string) Str::uuid();
        $this->putJson("/api/templates/$templateId", $this->templatePayload())->assertOk();

        $checklistId = (string) Str::uuid();
        $items = [['id' => (string) Str::uuid(), 'parent_id' => null, 'label' => 'Changelog', 'position' => 0, 'checked' => true, 'disabled' => false]];
        $this->putJson("/api/checklists/$checklistId", $this->checklistPayload($templateId, $items))
            ->assertOk()->assertJsonPath('template_id', $templateId)->assertJsonPath('items.0.checked', true);

        $this->deleteJson("/api/templates/$templateId")->assertNoContent();

        $this->getJson("/api/checklists/$checklistId")->assertOk()->assertJsonPath('template_id', null)->assertJsonCount(1, 'items');
    }

    public function test_checklist_is_independent_from_template_and_unknown_template_is_ignored(): void
    {
        $templateId = (string) Str::uuid();
        $this->putJson("/api/templates/$templateId", $this->templatePayload())->assertOk();

        $checklistId = (string) Str::uuid();
        $items = [['id' => (string) Str::uuid(), 'parent_id' => null, 'label' => 'Custom', 'position' => 0, 'checked' => false, 'disabled' => true]];
        $this->putJson("/api/checklists/$checklistId", $this->checklistPayload($templateId, $items))->assertOk();

        $this->putJson("/api/templates/$templateId", $this->templatePayload(['items' => []]))->assertOk();
        $this->getJson("/api/checklists/$checklistId")->assertJsonPath('items.0.label', 'Custom')->assertJsonPath('items.0.disabled', true);

        $other = (string) Str::uuid();
        $this->putJson("/api/checklists/$other", $this->checklistPayload((string) Str::uuid(), []))->assertOk()->assertJsonPath('template_id', null);
        $this->putJson("/api/checklists/$other", ['name' => 'n', 'items' => []])->assertUnprocessable();

        $this->deleteJson("/api/checklists/$other")->assertNoContent();
        $this->getJson('/api/checklists')->assertJsonCount(1);
    }

    public function test_spa_shell_is_served(): void
    {
        $this->get('/checklists/abc')->assertOk()->assertSee('id="app"', false);
    }
}
