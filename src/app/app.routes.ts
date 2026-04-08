import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main.layout-component';
import { DashboardComponent } from '../app/pages/dashboard/dashboard-component';
import { PatientsComponent } from '../app/pages/patients/patients-component';
import { FoodsPageComponent } from '../app/pages/foods/foods-components';
import { ExercisesComponent } from '../app/pages/exercise/exercise-components';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'patients', component: PatientsComponent },
      { path: 'foods', component: FoodsPageComponent },
      { path: 'exercises', component: ExercisesComponent }
    ]
  }
];