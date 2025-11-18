import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, AsyncValidatorFn, FormControlOptions } from '@angular/forms';

export interface FieldValidator {
  required?: boolean;
  email?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string | RegExp;
  fileType?: string[];
  fileSize?: number;
  isNumber?: boolean;          // Indica si el campo debe ser numérico
  allowDecimals?: boolean;     // Permite decimales
  decimalPlaces?: number;  
}

export interface ShowOnRule {
  property: string;
  op: 'eq' | 'neq' | 'gt' | 'lt';
  value: any;
}

export interface ShowOnConfig {
  satisfy: 'ALL' | 'ANY';
  rules: ShowOnRule[];
}

export interface FieldOption {
  value: any;
  label: string;
}
export type FieldType = 'text' | 'email' | 'number' | 'select' | 'select-with-create' | 'radio' | 'datetime' | 'date' | 'time' | 'file' | 'title' | 'column' | 'password' | 'subtitle';
export interface FormField {
  key: string;
  label?: string;
  type: FieldType;
  validators?: FieldValidator;
  options?: FieldOption[];
  showOn?: ShowOnConfig;
  readonly?: boolean;
  style?: string;
  text?: string;
  columns?: ColumnField[];
  filter?: boolean;
  format?: string;
  utc?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export interface ColumnField {
  id?: string;
  fields: FormField[];
}


@Component({
  selector: 'dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss'
})
export class DynamicFormComponent implements OnInit {
  showDatepicker: Record<string, boolean> = {};
  currentMonth: Record<string, Date> = {};
  selectedDate: Record<string, Date | null> = {};

  fileErrors: Record<string, string> = {};
  previewFiles: Record<string, string | null> = {};

  showPassword: Record<string, boolean> = {};
  showRepeatPassword: boolean = false;

  @Input() fields: FormField[] = [];
  @Input() initialData: Record<string, any> = {};
  @Input() askfor?: (form: FormGroup) => void;
  @Output() onFormChange = new EventEmitter<any>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) { }

 ngOnInit(): void {
  this.form = this.fb.group({});
  this.buildForm(this.fields);

  if (this.initialData) {
    this.form.patchValue(this.initialData);
    this.handleInitialValues(); // ✅ Cambiado de handleInitialFileValues a handleInitialValues
  }

  if (this.askfor) {
    this.askfor(this.form);
  }

  this.subscribeToFormChanges();
}

  private handleInitialFileValues(): void {
    this.fields.forEach(field => {
      if (field.columns) {
        field.columns.forEach(column => {
          column.fields.forEach(f => {
            if (f.type === 'file' && this.initialData[f.key]) {
              this.previewFiles[f.key] = this.initialData[f.key];
              this.form.get(f.key)?.setValue(this.initialData[f.key]);
            }
          });
        });
      }

      if (field.type === 'file' && this.initialData[field.key]) {
        this.previewFiles[field.key] = this.initialData[field.key];
        this.form.get(field.key)?.setValue(null);
      }
    });
  }

  private subscribeToFormChanges(): void {
    this.form.valueChanges.subscribe(() => {
      const isComplete = this.checkAllRequiredFieldsFilled();

      this.onFormChange.emit({
        data: this.form.getRawValue(),
        valid: this.form.valid,
        touched: this.form.touched,
        dirty: this.form.dirty,
        complete: isComplete
      });
    });
  }

  private checkAllRequiredFieldsFilled(): boolean {
    for (const key in this.form.controls) {
      const control = this.form.get(key);
      const isRequired = control?.hasValidator(Validators.required);

      if (isRequired && (control?.invalid || control?.value === '' || control?.value === null)) {
        return false;
      }
    }
    return true;
  }

  buildForm(fields: FormField[]): void {
    fields.forEach(field => {
      if (field.type === 'column' && field.columns) {
        field.columns.forEach(column => {
          column.fields.forEach(f => this.addControl(f));
        });
      } else if (field.key) {
        this.addControl(field);
      }
    });
  }

  togglePasswordVisibility(fieldKey: string): void {
    this.showPassword[fieldKey] = !this.showPassword[fieldKey];
  }


  private addControl(field: FormField): void {
  
  if (field.type === 'title' || field.type === 'subtitle') return;
    const baseValidators = this.mapValidators(field.validators);


    if (field.type === 'email') {
      baseValidators.push(Validators.email);
    }
    if (field.type === 'file') {
      const fileValidator = this.fileValidator(field.validators);
      if (fileValidator) {
        baseValidators.push(fileValidator);
      }
    }

    const controlOptions: FormControlOptions = {
      validators: baseValidators,
      nonNullable: false
    };

    const control = new FormControl(
      { value: '', disabled: field.readonly || false },
      controlOptions
    );

    this.form.addControl(field.key, control);

    if (field.key === 'password') {
      const passwordControl = new FormControl(
        '',
        { validators: [...baseValidators, this.passwordMatchValidator.bind(this)], nonNullable: false }
      );
      this.form.addControl('repeatPassword', passwordControl);
    }
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = this.form?.get('password')?.value;
    const repeatPassword = control.value;

    if (password !== repeatPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

 private mapValidators(validators?: FieldValidator): ValidatorFn[] {
  const v: ValidatorFn[] = [];
  if (!validators) return v;
  
  if (validators.required) v.push(Validators.required);
  if (validators.email) v.push(Validators.email);
  
  // Validadores para números
  if (validators.isNumber) {
    v.push(this.numberValidator(validators.allowDecimals, validators.decimalPlaces));
  }
  
  if (validators.maxLength !== undefined) v.push(Validators.maxLength(validators.maxLength));
  if (validators.minLength !== undefined) v.push(Validators.minLength(validators.minLength));
  if (validators.pattern) {
    const pattern = typeof validators.pattern === 'string' ? new RegExp(validators.pattern) : validators.pattern;
    v.push(Validators.pattern(pattern));
  }
  
  return v;
}

onCustomInput(event: any, fieldKey: string) {
  const value = event.target.value;
  if (value) {
    this.form.get(fieldKey)?.setValue(value);
  }
}

  getControl(key: string): AbstractControl | null {
    return this.form.get(key);
  }

  isFieldVisible(field: FormField): boolean {
    if (!field.showOn) return true;
    return field.showOn.rules.every(rule => {
      const val = this.form.get(rule.property)?.value;
      return rule.op === 'eq' ? val === rule.value : true;
    });
  }

  triggerFileInput(key: string): void {
    const input = document.getElementById('fileInput_' + key) as HTMLInputElement;
    input?.click();
  }

  onFileChange(event: Event, key: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.fileErrors[key] = '';

    const control = this.form.get(key);
    if (!control) return;

    const field = this.findFieldByKey(key);
    const validators = field?.validators || {};

    if (!file) {
      control.setValue(null);
      control.setErrors(null);
      control.markAsTouched();
      control.updateValueAndValidity();
      return;
    }

    if (validators.fileType && !validators.fileType.includes(file.type)) {
      this.fileErrors[key] = 'Tipo de archivo no permitido.';
      control.setErrors({ fileType: true });
      control.markAsTouched();
      control.updateValueAndValidity();
      return;
    }

    if (validators.fileSize && file.size > validators.fileSize) {
      this.fileErrors[key] = `El archivo supera el tamaño máximo de ${(validators.fileSize / 1024 / 1024).toFixed(1)} MB.`;
      control.setErrors({ fileSize: true });
      control.markAsTouched();
      control.updateValueAndValidity();
      return;
    }

    control.setValue(file);
    control.setErrors(null);
    control.markAsTouched();
    control.updateValueAndValidity();

    const reader = new FileReader();
    reader.onload = () => {
      this.previewFiles[key] = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  private findFieldByKey(key: string): FormField | undefined {
    for (const field of this.fields) {
      if (field.key === key) return field;
      if (field.columns) {
        for (const column of field.columns) {
          const found = column.fields.find(f => f.key === key);
          if (found) return found;
        }
      }
    }
    return undefined;
  }

  isImage(fileData: string | null): boolean {
    return typeof fileData === 'string' && fileData.startsWith('data:image/');
  }

  private fileValidator(validators?: FieldValidator): ValidatorFn | null {
    return (control: AbstractControl) => {
      const value = control.value;

      if (!value) {
        if (validators?.required) {
          return { required: true };
        }
        return null;
      }

      if (typeof value === 'string') {
        if (validators?.required && value.trim() === '') {
          return { required: true };
        }
        return null;
      }

      if (value instanceof File) {
        if (validators?.fileType && !validators.fileType.includes(value.type)) {
          return { fileType: true };
        }
        if (validators?.fileSize && value.size > validators.fileSize) {
          return { fileSize: true };
        }
      }

      return null;
    };
  }

initializeDatepickers() {
  this.fields.forEach(field => {
    if (field.type === 'datetime' && field.key) {
      this.currentMonth[field.key] = new Date();
      this.selectedDate[field.key] = this.form.get(field.key)?.value || null;
    }
  });
}

getDaysForMonth(fieldKey: string): any[] {
  const date = this.currentMonth[fieldKey] || new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const days: any[] = [];
  
  // Días del mes anterior
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const firstDayOfWeek = firstDay.getDay() || 7; // 0 (Domingo) a 6 (Sábado)
  
  for (let i = firstDayOfWeek - 1; i > 0; i--) {
    const dayDate = new Date(year, month - 1, prevMonthLastDay - i + 1);
    days.push({
      date: dayDate,
      currentMonth: false,
      selected: false,
      disabled: true
    });
  }
  
  // Días del mes actual
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dayDate = new Date(year, month, i);
    const isSelected = this.selectedDate[fieldKey]?.toDateString() === dayDate.toDateString();
    
    days.push({
      date: dayDate,
      currentMonth: true,
      selected: isSelected,
      disabled: this.isDateDisabled(fieldKey, dayDate)
    });
  }
  
  // Días del siguiente mes
  const daysToAdd = 42 - days.length; // 6 semanas
  for (let i = 1; i <= daysToAdd; i++) {
    const dayDate = new Date(year, month + 1, i);
    days.push({
      date: dayDate,
      currentMonth: false,
      selected: false,
      disabled: true
    });
  }
  
  return days;
}

isDateDisabled(fieldKey: string, date: Date): boolean {
  const field = this.findFieldByKey(fieldKey);
  if (!field) return false;
  
  const minDate = field.minDate ? new Date(field.minDate) : null;
  const maxDate = field.maxDate ? new Date(field.maxDate) : null;
  
  if (minDate && date < minDate) return true;
  if (maxDate && date > maxDate) return true;
  
  return false;
}

getDayClasses(fieldKey: string, day: any): string {
  let classes = 'w-8 h-8 rounded-full text-sm flex items-center justify-center ';
  
  if (day.disabled) {
    classes += 'text-amber-300 cursor-not-allowed';
  } else if (day.selected) {
    classes += 'bg-green-600 text-white font-medium';
  } else if (day.currentMonth) {
    classes += 'text-amber-900 hover:bg-amber-100';
  } else {
    classes += 'text-amber-400';
  }
  
  return classes;
}

prevMonth(fieldKey: string): void {
  const date = this.currentMonth[fieldKey] || new Date();
  this.currentMonth[fieldKey] = new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

nextMonth(fieldKey: string): void {
  const date = this.currentMonth[fieldKey] || new Date();
  this.currentMonth[fieldKey] = new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

selectDate(fieldKey: string, date: Date): void {
  this.selectedDate[fieldKey] = date;
  this.form.get(fieldKey)?.setValue(date);
  this.showDatepicker[fieldKey] = false;
}

toggleDatepicker(fieldKey: string): void {
  this.showDatepicker[fieldKey] = !this.showDatepicker[fieldKey];
  if (this.showDatepicker[fieldKey] && !this.currentMonth[fieldKey]) {
    this.currentMonth[fieldKey] = this.selectedDate[fieldKey] || new Date();
  }
}
private numberValidator(allowDecimals: boolean = false, decimalPlaces: number = 2): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    const value = control.value;
    
    if (value === null || value === undefined || value === '') {
      return null; // Permitir valores vacíos (si no es required)
    }
    
    // Convertir a número (los inputs HTML devuelven strings)
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return { 'notANumber': true };
    }
    
    if (!allowDecimals && !Number.isInteger(numValue)) {
      return { 'noDecimalsAllowed': true };
    }
    
    if (allowDecimals && decimalPlaces !== undefined) {
      const decimalPart = (numValue.toString().split('.')[1] || '').length;
      if (decimalPart > decimalPlaces) {
        return { 'tooManyDecimals': { required: decimalPlaces, actual: decimalPart } };
      }
    }
    
    // Convertir el valor a número en el control
    if (typeof value === 'string') {
      control.setValue(numValue, { emitEvent: false });
    }
    
    return null;
  };
}

getStepValue(validators: FieldValidator | undefined): string {
  if (!validators?.allowDecimals) return '1';
  if (!validators.decimalPlaces) return 'any';
  return '0.' + '1'.padStart(validators.decimalPlaces, '0');
}

private handleInitialValues(): void {
  this.fields.forEach(field => {
    if (field.columns) {
      field.columns.forEach(column => {
        column.fields.forEach(f => {
          this.processFieldInitialValue(f);
        });
      });
    }
    this.processFieldInitialValue(field);
  });
}

private processFieldInitialValue(field: FormField): void {
  if (field.type === 'file' && this.initialData[field.key]) {
    this.previewFiles[field.key] = this.initialData[field.key];
    this.form.get(field.key)?.setValue(this.initialData[field.key]);
  }
  
  // ✅ NUEVO: Manejo especial para campos de fecha
  if ((field.type === 'date' || field.type === 'datetime') && this.initialData[field.key]) {
    const dateValue = this.initialData[field.key];
    
    if (dateValue) {
      // Convertir a Date object si es string
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      
      // Ajustar la fecha para compensar el desfase de zona horaria
      const adjustedDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
      
      // Formatear como YYYY-MM-DD para el input date
      const formattedDate = this.formatDateForInput(adjustedDate);
      
      this.form.get(field.key)?.setValue(formattedDate);
    }
  }
}

private formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

  onSubmit(): void {
    if (this.form.valid) {
    } else {
      this.form.markAllAsTouched();
    }
  }
}