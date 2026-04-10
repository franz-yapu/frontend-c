import { min } from "rxjs"


export const registerFormFields = (catalogs: any) => {

    return ([

        {
            type: 'column',
            columns: [
                {
                    fields: [

                        {
                            key: 'firstName',
                            label: 'REGISTER.FIRST_NAME',
                            type: 'text',
                            validators: { required: true, maxLength: 50, minLength: 0 },
                        },
                        {
                            key: 'lastName',
                            label: 'REGISTER.LAST_NAME',
                            type: 'text',
                            validators: { required: true, maxLength: 100, minLength: 0 },
                        },
                        {
                            key: 'companyName',
                            label: 'REGISTER.COMPANY_NAME',
                            type: 'text',
                            validators: { maxLength: 100, minLength: 0 },
                        },
                        {
                            key: 'phone',
                            label: 'REGISTER.PHONE',
                            type: 'number',
                            validators: { required: true  ,minLength:8 ,maxLength: 30 },

                        },
                       /*  {
                            key: 'roleName',
                            label: 'role',
                            type: 'select',
                            options: catalogs['roles'],
                            validators: { required: true },
                        }, */
                        {
                            key: 'email',
                            label: 'REGISTER.EMAIL',
                            type: 'email',

                            validators: { required: true },

                        },
                        {
                            key: 'password',
                            label: 'REGISTER.PASSWORD',
                            type: 'password',

                            validators: { required: true,   maxLength: 30 ,minLength:6},

                        },

                    ]
                },


            ]
        },


    ]
    )
}