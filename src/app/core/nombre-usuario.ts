/**
 * Cómo se enseña el nombre de una persona en la interfaz.
 *
 * El registro no obliga a poner nombre y apellido, y la plantilla concatenaba
 * los dos tal cual: sin ellos salía "null null" en la cabecera y el tour
 * saludaba "Hola,". Aquí se cae al correo cuando faltan.
 */
type Persona = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  companyName?: string | null;
} | null | undefined;

const limpio = (x: unknown) => (typeof x === 'string' ? x.trim() : '');

/** "Nombre Apellido", o el correo si no hay ninguno de los dos. */
export function nombreCompleto(u: Persona): string {
  const persona = [limpio(u?.firstName), limpio(u?.lastName)]
    .filter((x) => x.length > 0)
    .join(' ');
  return persona || limpio(u?.email);
}

/** Solo el nombre de pila (para saludar), o la parte del correo antes de la @. */
export function nombrePila(u: Persona): string {
  return limpio(u?.firstName) || limpio(u?.email).split('@')[0];
}

/** Iniciales para el avatar: "NA", o la primera letra del correo. */
export function iniciales(u: Persona): string {
  const ini =
    limpio(u?.firstName).charAt(0) + limpio(u?.lastName).charAt(0);
  return (ini || limpio(u?.email).charAt(0) || '?').toUpperCase();
}

/**
 * Nombre de un postor en listas públicas: la empresa, o "Nombre A.".
 * Cadena vacía si no hay ninguno (quien llama pone su texto de respaldo);
 * aquí no se usa el correo porque estas listas las ve cualquiera.
 */
export function nombrePostor(u: Persona): string {
  const empresa = limpio(u?.companyName);
  if (empresa) return empresa;
  const nombre = limpio(u?.firstName);
  const inicial = limpio(u?.lastName).charAt(0);
  return [nombre, inicial ? inicial + '.' : ''].filter((x) => x).join(' ');
}
