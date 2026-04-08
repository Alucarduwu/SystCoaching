import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FoodCardComponent } from './food-card/food-card';
import { FoodFormModalComponent } from './food-form-modal/food-form';

export interface FoodItem {
  id: number;
  nombre: string;
  icono?: string | null;

  categoria?: string | null;
  objetivo?: string | null;

  kcal_100g?: number | null;
  proteina_100g?: number | null;
  carbohidratos_100g?: number | null;
  grasas_100g?: number | null;
  fibra_100g?: number | null;
  sodio_100g?: number | null;
  azucar_100g?: number | null;

  // Fallback variants for older DB versions or mapping mismatches
  kcal?: number | null;
  calorias?: number | null;
  proteina?: number | null;
  carbohidratos?: number | null;
  grasas?: number | null;

  porcion_base_g?: number | null;
  notas?: string | null;

  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-foods-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FoodCardComponent,
    FoodFormModalComponent
  ],
  templateUrl: './foods-page.component.html',
  styleUrls: ['./foods-page.component.scss']
})
export class FoodsPageComponent implements OnInit {
  loading = signal(false);
  saving = signal(false);
  updatingFood = signal(false);

  showFoodModal = signal(false);
  editingFood = signal(false);

  errorMessage = signal('');
  foods = signal<FoodItem[]>([]);
  foodSearch = signal('');
  categoryFilter = signal('Todos');

  selectedFoodId = signal<number | null>(null);

  newFood: any = this.getEmptyFood();
  editFoodForm: any = {};

  ngOnInit(): void {
    this.loadFoods();
  }

  getEmptyFood() {
    return {
      nombre: '',
      icono: '🍽️',
      categoria: 'Sin Categoría',
      objetivo: '',
      kcal_100g: '',
      proteina_100g: '',
      carbohidratos_100g: '',
      grasas_100g: '',
      fibra_100g: '',
      sodio_100g: '',
      azucar_100g: '',
      porcion_base_g: 100,
      notas: ''
    };
  }

  setFoodSearch(value: string) {
    this.foodSearch.set(value);
  }

  filteredFoods = computed(() => {
    const term = this.foodSearch().trim().toLowerCase();
    const filter = this.categoryFilter();
    let foods = this.foods();

    if (filter !== 'Todos') {
      foods = foods.filter(f => {
        const cat = String(f.categoria || '').toLowerCase().trim();
        const fval = filter.toLowerCase().trim();
        return cat === fval || (fval.startsWith(cat) && cat.length > 3) || (cat.startsWith(fval) && fval.length > 3);
      });
    }

    if (!term) return foods;

    return foods.filter((food) => {
      const nombre = String(food.nombre || '').toLowerCase();
      const categoria = String(food.categoria || '').toLowerCase();
      const objetivo = String(food.objetivo || '').toLowerCase();
      const notas = String(food.notas || '').toLowerCase();

      return (
        nombre.includes(term) ||
        categoria.includes(term) ||
        objetivo.includes(term) ||
        notas.includes(term)
      );
    });
  });

  async loadFoods() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const response = await window.electronAPI.foods.getAll();

      if (!response.ok) {
        throw new Error(response.error || 'No se pudieron cargar los alimentos.');
      }

      // Normalizar datos recibidos para que el formulario los detecte (Fallback Mapping)
      const normalizedData = (response.data || []).map((food: any) => ({
        ...food,
        kcal_100g: food.kcal_100g ?? food.kcal ?? food.calorias ?? 0,
        proteina_100g: food.proteina_100g ?? food.proteina ?? 0,
        carbohidratos_100g: food.carbohidratos_100g ?? food.carbohidratos ?? 0,
        grasas_100g: food.grasas_100g ?? food.grasas ?? 0,
        fibra_100g: food.fibra_100g ?? food.fibra ?? 0,
        sodio_100g: food.sodio_100g ?? food.sodio ?? 0,
        azucar_100g: food.azucar_100g ?? food.azucar ?? 0
      }));

      this.foods.set(normalizedData);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Ocurrió un error cargando alimentos.');
    } finally {
      this.loading.set(false);
    }
  }

  openCreateFoodModal() {
    this.newFood = this.getEmptyFood();
    this.showFoodModal.set(true);
    this.editingFood.set(false);
    this.selectedFoodId.set(null);
    this.errorMessage.set('');
  }

  openEditFoodModal(food: FoodItem) {
    this.selectedFoodId.set(food.id);
    this.editingFood.set(true);
    this.showFoodModal.set(true);

    this.editFoodForm = {
      nombre: food.nombre || '',
      icono: food.icono || '🍽️',
      categoria: food.categoria || '',
      objetivo: food.objetivo || '',
      kcal_100g: food.kcal_100g ?? '',
      proteina_100g: food.proteina_100g ?? '',
      carbohidratos_100g: food.carbohidratos_100g ?? '',
      grasas_100g: food.grasas_100g ?? '',
      fibra_100g: food.fibra_100g ?? '',
      sodio_100g: food.sodio_100g ?? '',
      azucar_100g: food.azucar_100g ?? '',
      porcion_base_g: food.porcion_base_g ?? 100,
      notas: food.notas || ''
    };

    this.errorMessage.set('');
  }

  closeFoodModal() {
    this.showFoodModal.set(false);
    this.editingFood.set(false);
    this.selectedFoodId.set(null);
  }

  async saveFood() {
    this.errorMessage.set('');

    const form = this.editingFood() ? this.editFoodForm : this.newFood;

    // Preparar payload con Triple Persistencia (100g + kcal + calorias + campos planos)
    const payload = {
      ...form,
      kcal: form.kcal_100g,
      calorias: form.kcal_100g, // Fallback crítico
      proteina: form.proteina_100g,
      carbohidratos: form.carbohidratos_100g,
      grasas: form.grasas_100g,
      fibra: form.fibra_100g,
      sodio: form.sodio_100g,
      azucar: form.azucar_100g
    };

    if (!form.nombre?.trim()) {
      this.errorMessage.set('El nombre del alimento es obligatorio.');
      return;
    }

    if (this.editingFood()) {
      const foodId = this.selectedFoodId();

      if (!foodId) {
        this.errorMessage.set('No hay un alimento seleccionado.');
        return;
      }

      this.updatingFood.set(true);

      try {
        const response = await window.electronAPI.foods.update({
          id: foodId,
          ...payload
        });

        if (!response.ok) {
          throw new Error(response.error || 'No se pudieron guardar los cambios.');
        }

        this.closeFoodModal();
        await this.loadFoods();
      } catch (error: any) {
        this.errorMessage.set(error.message || 'Error al actualizar el alimento.');
      } finally {
        this.updatingFood.set(false);
      }

      return;
    }

    this.saving.set(true);

    try {
      const response = await window.electronAPI.foods.create(payload);

      if (!response.ok) {
        throw new Error(response.error || 'No se pudo crear el alimento.');
      }

      this.closeFoodModal();
      await this.loadFoods();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Ocurrió un error guardando el alimento.');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteFood(foodId: number) {
    const confirmed = confirm('¿Estás seguro de que deseas eliminar este alimento?');
    if (!confirmed) return;

    this.errorMessage.set('');

    try {
      const response = await window.electronAPI.foods.delete(foodId);

      if (!response.ok) {
        throw new Error(response.error || 'No se pudo eliminar el alimento.');
      }

      if (this.selectedFoodId() === foodId) {
        this.closeFoodModal();
      }

      await this.loadFoods();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al eliminar el alimento.');
    }
  }

  get activeFoodForm() {
    return this.editingFood() ? this.editFoodForm : this.newFood;
  }

  get isSubmitting() {
    return this.editingFood() ? this.updatingFood() : this.saving();
  }
}