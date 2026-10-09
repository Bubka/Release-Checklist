<?php

use App\Http\Controllers\Api\ChecklistController;
use App\Http\Controllers\Api\TemplateController;
use Illuminate\Support\Facades\Route;

Route::get('templates', [TemplateController::class, 'index']);
Route::get('templates/{id}', [TemplateController::class, 'show']);
Route::put('templates/{id}', [TemplateController::class, 'upsert']);
Route::delete('templates/{id}', [TemplateController::class, 'destroy']);

Route::get('checklists', [ChecklistController::class, 'index']);
Route::get('checklists/{id}', [ChecklistController::class, 'show']);
Route::put('checklists/{id}', [ChecklistController::class, 'upsert']);
Route::delete('checklists/{id}', [ChecklistController::class, 'destroy']);
