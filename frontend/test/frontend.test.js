import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sourcePath = new URL("../src/", import.meta.url);

test("index carga el módulo AngularJS desde la nueva estructura", async () => {
  const html = await readFile(new URL("index.html", sourcePath), "utf8");
  assert.match(html, /\/app\/app\.module\.js/);
  assert.match(html, /\/common\/services\/api\.service\.js/);
  assert.match(html, /\/features\/booking\/booking\.component\.js/);
  assert.match(html, /<featured-services/);
  assert.match(html, /featured-services\.css/);
  assert.match(html, /ng-if="!home\.sessionUser" href="\/login\.html"/);
});

test("componentes principales siguen registrados", async () => {
  const files = [
    "app/controllers/home.controller.js",
    "app/components/footer.component.js",
    "features/specialties/specialty-list.component.js",
    "features/booking/booking.component.js",
    "features/care/care-benefits.component.js",
    "features/reviews/reviews.component.js",
    "features/services/featured-services.component.js",
  ];

  for (const file of files) {
    const source = await readFile(new URL(file, sourcePath), "utf8");
    assert.match(source, /angular[\s\S]*serviciosMedicosApp/);
  }
});

test("servicio API contiene las operaciones existentes", async () => {
  const source = await readFile(
    new URL("common/services/api.service.js", sourcePath),
    "utf8",
  );
  for (const endpoint of [
    "getMedicalServices",
    "getSpecialties",
    "getDoctors",
    "getAvailability",
    "createAppointment",
  ]) {
    assert.match(source, new RegExp(endpoint));
  }
});

test("perfil incluye datos editables y citas separadas", async () => {
  const html = await readFile(new URL("profile.html", sourcePath), "utf8");
  assert.match(html, /id="profile-form"/);
  assert.match(html, /Agendadas/);
  assert.match(html, /Completadas/);

  const script = await readFile(
    new URL("features/profile/profile.js", sourcePath),
    "utf8",
  );
  assert.match(script, /\/api\/profile/);
  assert.match(script, /\/api\/profile\/appointments/);
  assert.match(script, /Cambiar horario/);
  assert.match(script, /Confirmar cambio/);
  assert.match(script, /excludeAppointmentId/);
});

test("los estilos globales y del perfil comparten la paleta MEDICOM", async () => {
  const globalStyles = await readFile(new URL("styles.css", sourcePath), "utf8");
  const profileStyles = await readFile(
    new URL("features/profile/profile.css", sourcePath),
    "utf8",
  );
  assert.match(globalStyles, /:root\s*\{[^}]*--navy:\s*#003b71/);
  assert.match(globalStyles, /:root\s*\{[^}]*--cyan:\s*#009fd9/);
  assert.match(profileStyles, /body\.profile-page/);
  assert.match(profileStyles, /background:\s*#f4f9fc/);
  assert.doesNotMatch(profileStyles, /backdrop-filter|rgba\(255,\s*255,\s*255,\s*0\.(7|8)/);
});
