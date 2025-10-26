import { read } from "fs"


export const changeFormFields = (catalogs: any) => {

    return ([

        {
            type: 'column',
            columns: [
                {
                    fields: [
                        {
                            key: 'newPassword',
                            label: 'Nueva contraseña',
                            type: 'password',
                            validators: { required: true},
                        },
                       
                        

                    ]
                }


            ]
        },


    ]
    )
}