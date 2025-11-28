export const lotFormFields = (catalogs: any) => {
  return [
    {
      type: 'subtitle',
      text: '1. INFORMACION GENERAL DEL CAFE',
      style: 'section'
    },
    {
      type: 'column',
      columns: [
        {
          fields: [
            {
              key: 'name',
              label: 'Nombre del Lote',
              type: 'text',
              validators: { required: false, maxLength: 50, minLength: 0 }
            },
            {
              key: 'position',
              label: 'Posición (Ranking)',
              type: 'number',
              validators: {
                required: false,
                min: 0,
                max: 100
              }
            },
            {
              key: 'cupScore',
              label: 'Puntaje de Catación',
              type: 'number',
              validators: {
                required: false,
                min: 0,
                max: 100,
                decimalPlaces: 2
              }
            },
            {
              key: 'variety',
              label: 'Variedad',
              type: 'text',
              validators: { required: false },
              
            },
          ]
        },
        {
          fields: [
            {
              key: 'process',
              label: 'Proceso',
              type: 'text',
              validators: { required: false },
              
            },
            {
              key: 'dryingSystem',
              label: 'Sistema de Secado',
              type: 'text',
              validators: { required: false, maxLength: 50 },
             
            },
            {
              key: 'quantity',
              label: 'Cantidad (kg)',
              type: 'number',
              validators: {
                required: false,
                min: 0,
                decimalPlaces: 2
              }
            },
            {
              key: 'quantityLbs',
              label: 'Cantidad (lbs)',
              type: 'number',
              validators: {
                required: false,
                min: 0,
                decimalPlaces: 2
              }
            },
          ]
        },
      ]
    },
    {
      type: 'subtitle',
      text: '2. ORIGEN DEL LOTE',
      style: 'section'
    },
    {
      type: 'column',
      columns: [
        {
          fields: [
            {
              key: 'harvestYear',
              label: 'Año de Cosecha',
              type: 'number',
              validators: {
                required: false,
                min: 2000,
                max: new Date().getFullYear()
              }
            },
            {
              key: 'country',
              label: 'País',
              type: 'select-with-create',
              validators: { required: false },
              options: catalogs['countries'] || []
            },
            {
              key: 'region',
              label: 'Departamento/Región',
              type: 'select-with-create',
              validators: { required: false, maxLength: 100 },
              options: catalogs['regions'] || []
            },
          ]
        },
        {
          fields: [
            {
              key: 'province',
              label: 'Provincia',
              type: 'text',
              validators: { required: false, maxLength: 100 },
              
            },
            {
              key: 'municipality',
              label: 'Municipio',
              type: 'text',
              validators: { required: false, maxLength: 100 },
             
            },
            {
              key: 'community',
              label: 'Comunidad',
              type: 'text',
              validators: { required: false, maxLength: 100 },
             
            },
          ]
        },
      ]
    },
    {
      type: 'subtitle',
      text: '3. INFORMACION TECNICA ',
      style: 'section'
    },
    {
      type: 'column',
      columns: [
        
      
      
       
        {
          fields: [
           {
              key: 'altitude',
              label: 'Altitud (msnm)',
              type: 'number',
              validators: {
                required: false,
                min: 0,
                max: 4000
              }
            },
            {
              key: 'productionSystem',
              label: 'Sistema de Producción',
              type: 'text',
               validators: {required: false, maxLength: 50 }
            },
            {
              key: 'shadeType',
              label: 'Tipo de Sombra',
              type: 'text',
              validators: {required: false, maxLength: 50 }
            },
          ]
        },
     /*    {
          fields: [
            {
              key: 'images',
              label: 'Imágenes del Lote',
              type: 'file',
              multiple: false,
              validators: {
                fileType: ['image/png', 'image/jpeg'],
                fileSize: 2 * 1024 * 1024 // 2 MB
              }
            },
            {
              key: 'documents',
              label: 'Documentos del Lote',
              type: 'file',
              validators: {
                fileType: ['application/pdf'],
                fileSize: 5 * 1024 * 1024 // 5 MB
              }
            },

          ]
        } */
      ]
    },
      {
      type: 'subtitle',
      text: '4. PERFIL EN TAZA ',
      style: 'section'
    },
    {
      type: 'column',
      columns: [
        {
          fields: [

             {
              key: 'fragranceAroma',
              label: 'Fragancia/Aroma',
              type: 'text',
              validators: { required: false,maxLength: 200 }
            },
            {
              key: 'acidity',
              label: 'Acidez',
              type: 'text',
              validators: { required: false,maxLength: 200 }
            },
            {
              key: 'flavor',
              label: 'Sabor',
              type: 'text',
              validators: { required :false ,maxLength: 200 }
            },
          
          ]
        },

        
      ]
    },
     {
      type: 'subtitle',
      text: '5. Productor ',
      style: 'section'
    },
    {
      type: 'column',
      columns: [
        {
          fields: [

             {
              key: 'seller',
              label:'Productor',
              type: 'text',
               validators: { 
                required: false,
                min: 0,
                max: 1000,
               },
             
            },
            {
              key: 'startingPrice',
              label:'Precio inicial una libra en ($)',
              type: 'number',
              validators: { 
                required: false,
                min: 0,
                max: 1000,
                decimalPlaces: 2
               },
              
            },
           
          
          ]
        },

        
      ]
    },
  ];
};