<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checklists', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('version');
            // Deleting a template must never delete the checklists created from it.
            $table->foreignUuid('template_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('checklist_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('checklist_id')->constrained()->cascadeOnDelete();
            $table->uuid('parent_id')->nullable()->index();
            $table->string('label');
            $table->unsignedInteger('position')->default(0);
            $table->boolean('checked')->default(false);
            $table->boolean('disabled')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checklist_items');
        Schema::dropIfExists('checklists');
    }
};
