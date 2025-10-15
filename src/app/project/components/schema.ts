

export const PatientsFormFields=(catalogs: any)=> {
    
      return ([
        {

            type: 'title',
            text: 'patient.generalData',
            style: 'title',
        },
        {
          type: 'column',
          columns: [
            {
              fields: [
                {
                  key: 'idNumber',
                  label: 'patient.idNumber',
                  type: 'number',
                  readonly :true,
                  validators: { required: true, maxLength: 50, minLength: 0 },
                },
                {
                  key: 'firstName',
                  label: 'patient.firstName',
                  type: 'text',
                  validators: { required: true, maxLength: 50, minLength: 0 },
                },
                {
                  key: 'lastName',
                  label: 'patient.lastName',
                  type: 'text',
                  validators: { required: true, maxLength: 50, minLength: 0 },
                },
                {
                  key: 'middleName',
                  label: 'patient.middleName',
                  type: 'text',
                  validators: { required: true, maxLength: 50, minLength: 0 },
                },
                {
                  key: 'genderCt',
                  label: 'patient.genderCt',
                  type: 'radio',
                  options: catalogs['CRISTAL'],
                  validators: { required: true },

                },
                {
                  key: 'otherGender',
                  label: 'patient.otherGender',
                  type: 'text',
                  validators: { maxLength: 50, minLength: 0 },
                  showOn : {
                        satisfy:'ALL',
                        rules:[
                         { property: 'genderCt',
                          op: 'eq',
                          value : '3'
                         }
                        ]
                  }
                }
              ]
            },
            {
              fields: [
                {
                  key: 'admissionDate',
                  label: 'patient.admissionDate',
                  type: 'datetime',
                  validators: { required: true },
                  format: "dd/mm/yy",
                  utc: true,
                  readonly :true,
                },
                {
                  key: 'birthDate',
                  label: 'patient.birthDate',
                  type: 'datetime',
                  minDate: new Date(new Date().setFullYear(new Date().getFullYear() - 100)),
                  maxDate: new Date(new Date()),
                  format: "dd/mm/yy",
                  utc: true,
                  validators: { required: true },
                  class:'disabled'
                },
                {
                  key: 'birthPlaceCt',
                  label: 'patient.birthPlaceCt',
                  type: 'select',
                  validators: { required: true },
                  options: catalogs['CRISTAL'],

                },
                {
                  key: 'nationalityCt',
                  label: 'patient.nationalityCt',
                  type: 'radio',
                  options: catalogs['CRISTAL-NATIONALITY'],
                  validators: { required: true },

                },
                {
                  key: 'otherNationality',
                  label: 'patient.otherNationality',
                  type: 'text',
                  showOn : {
                    satisfy:'ALL',
                    rules:[
                     { property: 'nationalityCt',
                      op: 'eq',
                      value : '2'
                     }
                    ]
                  },
                  validators: { required: true , maxLength:50, minLength: 3},
                }
              ]
            }
          ]
        },
        {

          type: 'title',
          text: 'patient.contactLocation',
          style: 'title',
      },
      {
        type: 'column',
        columns: [
          {
            fields: [
              {

                type: 'title',
                text: 'patient.contact',
                style: 'subtitle',
             },
              {
                key: 'privatePhone',
                label: 'patient.privatePhone',
                type: 'text',
                validators: {
                  required: true,
                  pattern: /^[0-9()+-\s]{1,}$/,
                  maxLength:50,
                  minLength: 8
                 },
              },
              {
                key: 'mobilePhone',
                label: 'patient.mobilePhone',
                type: 'text',
                validators: {
                  required: true,
                  pattern: /^[0-9()+-\s]{1,}$/,
                  maxLength:50,
                  minLength: 8
                 },
              },
              {
                key: 'email1',
                label: 'patient.email1',
                type: 'text',
                validators: {
                  required: true,
                  email:true,
                  maxLength:50,
                  minLength: 0
                 },
              },
              {
                key: 'email2',
                label: 'patient.email2',
                type: 'text',
                validators: {
                  email:true,
                  maxLength:50,
                  minLength: 0
                 },
              }
            ]
          },
          {
            fields: [
              {

                type: 'title',
                text: 'patient.residence',
                style: 'subtitle',
             },
              {
                key: 'countryCt',
                label: 'patient.countryCt',
                type: 'radio',
                options: catalogs['CRISTAL-COUNTRIES'],
                validators: { required: true },
              },
              {
                key: 'otherCountryCt',
                label: 'patient.otherCountryCt',
                type: 'text',
                showOn:{
                  satisfy: 'ALL',
                  rules:[
                    {
                      property: 'countryCt',
                      op: 'eq',
                      value: '2'
                    }

                  ]
                },
                validators: { maxLength:100, minLength: 0}
              },
              {
                key: 'stateCt',
                label: 'patient.stateCt',
                type: 'select',
                options: catalogs['CRISTAL-STATES'],
                filter:true,
                validators: { required: true},
                showOn: {
                  satisfy: 'ALL',
                  rules: [
                    {
                      property: 'countryCt',
                      op: 'eq',
                      value: '1'
                    }
                  ]

                }
              },
              {
                key: 'municipality',
                label: 'patient.municipality',
                type: 'text',
                validators: { required: true, maxLength:50, minLength: 0 },
                showOn: {
                  satisfy: 'ALL',
                  rules: [
                    {
                      property: 'countryCt',
                      op: 'eq',
                      value: '1'
                    }
                  ]

                }
              },
              {
                key: 'neighborhood',
                label: 'patient.neighborhood',
                type: 'text',
                showOn: {
                  satisfy: 'ALL',
                  rules: [
                    {
                      property: 'countryCt',
                      op: 'eq',
                      value: '1'
                    }
                  ]

                },
                validators: { required: true, maxLength:50, minLength: 0 },
              },
              {
                key: 'street',
                label: 'patient.street',
                type: 'text',
                validators: { required: true, maxLength:50, minLength: 0 },
              },
              {
                key: 'interiorNumber',
                label: 'patient.interiorNumber',
                type: 'text',
                validators: { required: true, maxLength:50, minLength: 0 },
              },
              {
                key: 'exteriorNumber',
                label: 'patient.exteriorNumber',
                type: 'text',
                validators: {  maxLength:50, minLength: 0 },
              },
              {
                key: 'postalCode',
                label: 'patient.postalCode',
                type: 'text',
                validators: { required: true, maxLength:50, minLength: 0 },
              }
            ]
          }
        ]
      },
      ]
    )
   }