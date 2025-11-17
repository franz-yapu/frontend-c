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
              validators: { required: true, maxLength: 50, minLength: 0 }
            },
            {
              key: 'position',
              label: 'Posición (Ranking)',
              type: 'number',
              validators: {
                required: true,
                min: 0,
                max: 100
              }
            },
            {
              key: 'cupScore',
              label: 'Puntaje de Catación',
              type: 'number',
              validators: {
                required: true,
                min: 0,
                max: 100,
                decimalPlaces: 2
              }
            },
            {
              key: 'variety',
              label: 'Variedad',
              type: 'select-with-create',
              validators: { required: true },
              options: catalogs['varieties'] || []
            },
          ]
        },
        {
          fields: [
            {
              key: 'process',
              label: 'Proceso',
              type: 'select-with-create',
              validators: { required: true },
              options: catalogs['processes'] || []
            },
            {
              key: 'dryingSystem',
              label: 'Sistema de Secado',
              type: 'select-with-create',
              validators: { required: true, maxLength: 50 },
              options: catalogs['dryingSystems'] || []
            },
            {
              key: 'quantity',
              label: 'Cantidad (kg)',
              type: 'number',
              validators: {
                required: true,
                min: 0,
                decimalPlaces: 2
              }
            },
            {
              key: 'quantityLbs',
              label: 'Cantidad (lbs)',
              type: 'number',
              validators: {
                required: true,
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
                required: true,
                min: 2000,
                max: new Date().getFullYear()
              }
            },
            {
              key: 'country',
              label: 'País',
              type: 'select-with-create',
              validators: { required: true },
              options: catalogs['countries'] || []
            },
            {
              key: 'region',
              label: 'Departamento/Región',
              type: 'select-with-create',
              validators: { required: true, maxLength: 100 },
              options: catalogs['regions'] || []
            },
          ]
        },
        {
          fields: [
            {
              key: 'province',
              label: 'Provincia',
              type: 'select-with-create',
              validators: { required: true, maxLength: 100 },
              options: catalogs['provinces'] || []
            },
            {
              key: 'municipality',
              label: 'Municipio',
              type: 'select-with-create',
              validators: { required: true, maxLength: 100 },
              options: catalogs['municipalities'] || []
            },
            {
              key: 'community',
              label: 'Comunidad',
              type: 'select-with-create',
              validators: { required: true, maxLength: 100 },
              options: catalogs['communities'] || []
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
                required: true,
                min: 0,
                max: 4000
              }
            },
            {
              key: 'productionSystem',
              label: 'Sistema de Producción',
              type: 'text',
               validators: {required: true, maxLength: 50 }
            },
            {
              key: 'shadeType',
              label: 'Tipo de Sombra',
              type: 'text',
              validators: {required: true, maxLength: 50 }
            },
          ]
        },
     /*    {
          fields: [
            {
              key: 'images',
              label: 'Imágenes del Lote',
              type: 'file',
              multiple: true,
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
              validators: { required: true,maxLength: 200 }
            },
            {
              key: 'acidity',
              label: 'Acidez',
              type: 'text',
              validators: { required: true,maxLength: 200 }
            },
            {
              key: 'flavor',
              label: 'Sabor',
              type: 'text',
              validators: { required :true ,maxLength: 200 }
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
              key: 'sellerId',
              label:'Productor',
              type: 'select',
              validators: { required: true },
              options: catalogs['sellerId'],
            },
            {
              key: 'startingPrice',
              label:'Precio inicial una libra en ($)',
              type: 'number',
              validators: { 
                required: true,
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