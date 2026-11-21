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
