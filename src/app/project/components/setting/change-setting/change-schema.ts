import { read } from "fs"


export const changeFormFields = (catalogs: any) => {

    return ([

        {
            type: 'column',
            columns: [
                {
                    fields: [

                        {
                            key: 'currentPassword',
                            label: 'contraseña actual ',
                            type: 'password',
                            validators: { required: true },
                        },
                        {
                            // key 'password' (no 'newPassword') para que el
                            // DynamicForm añada el campo de confirmación
                            // ("Repetir contraseña") y valide que coincidan.
                            // En save() se mapea a newPassword para el backend.
                            key: 'password',
                            label: 'Nueva contraseña',
                            type: 'password',
                            validators: { required: true, minLength: 6 },
                        },
                       
                        

                    ]
                }


            ]
        },


    ]
    )
}