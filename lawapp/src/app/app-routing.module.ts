import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllTemplateFrontComponent } from './FrontOffice/all-template-front/all-template-front.component';
import { AllTemplateBackComponent } from './BackOffice/all-template-back/all-template-back.component';
import { LawFirmComponent } from './FrontOffice/law-firm/law-firm.component';
import { AboutComponent } from './FrontOffice/about/about.component';
import { FormateurComponent } from './FrontOffice/formateur/formateur.component';
import { LawyerComponent } from './FrontOffice/lawyer/lawyer.component';
import { CasesComponent } from './FrontOffice/cases/cases.component';
import { PricingComponent } from './FrontOffice/pricing/pricing.component';
import { ServicesComponent } from './FrontOffice/services/services.component';
import { ServiceDetailComponent } from './FrontOffice/service-detail/service-detail.component';
import { BlogsComponent } from './FrontOffice/blogs/blogs.component';
import { BlogDetailComponent } from './FrontOffice/blog-detail/blog-detail.component';
import { ContactComponent } from './FrontOffice/contact/contact.component';
import { FormDataComponent } from './FrontOffice/blogs/form-data/form-data.component';

const routes: Routes = [
  {path:"",component:AllTemplateFrontComponent,
    children:[{path:"lawFirm",component:LawFirmComponent},
      {path:"about",component:AboutComponent},
      {path:"Formateur",component:FormateurComponent},
      {path:"Lawyer",component:LawyerComponent},
      {path:"case",component:CasesComponent},
      {path:"pricing",component:PricingComponent},
      {path:"services",component:ServicesComponent},
      {path:"serviceDetail",component:ServiceDetailComponent},
      {
        path: 'blogs',  // Parent route
        component: BlogsComponent, // Should contain <router-outlet>
        children: [
          { path: 'form-data', component: FormDataComponent }, // Your form route
          // ... other child routes
        ]
      },
    
      {path:"blogs/:id",component:BlogDetailComponent},
      {path:"contact",component:ContactComponent},
      
    ]
  },

  {path:"admin",component:AllTemplateBackComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
