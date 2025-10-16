import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AllTemplateBackComponent } from './BackOffice/all-template-back/all-template-back.component';
import { FooterBackComponent } from './BackOffice/footer-back/footer-back.component';
import { NavbarBackComponent } from './BackOffice/navbar-back/navbar-back.component';
import { SidebarBackComponent } from './BackOffice/sidebar-back/sidebar-back.component';
import { AllTemplateFrontComponent } from './FrontOffice/all-template-front/all-template-front.component';
import { FooterFrontComponent } from './FrontOffice/footer-front/footer-front.component';
import { HeaderFrontComponent } from './FrontOffice/header-front/header-front.component';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';


//       return;
//     }

@NgModule({
  declarations: [
    AppComponent,
    AllTemplateBackComponent,
    FooterBackComponent,
    NavbarBackComponent,
    SidebarBackComponent,
    AllTemplateFrontComponent,
    FooterFrontComponent,
    HeaderFrontComponent,
    LawFirmComponent,
    AboutComponent,
    FormateurComponent,
    LawyerComponent,
    CasesComponent,
    PricingComponent,
    ServicesComponent,
    ServiceDetailComponent,
    BlogsComponent,
    BlogDetailComponent,
    ContactComponent,
    FormDataComponent,
  
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    RouterModule.forChild([{ path: '', component: FormDataComponent }]),
    NoopAnimationsModule,
    FormsModule

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
