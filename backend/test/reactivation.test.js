import { test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { sequelize, RolUsuario, Usuario } from "../src/models/index.js";
import { registerUser, reactivateUser } from "../src/services/authService.js";

test("el registro distingue cuentas activas de bajas de consumidores", async (t) => {
  t.mock.method(sequelize, "transaction", async (run) => run({}));
  t.mock.method(RolUsuario, "findOne", async () => ({ roleId: 1 }));
  const user = { roleId: 1, isActive: false };
  t.mock.method(Usuario, "findOne", async () => user);
  const register = () => registerUser({ email: "paciente@example.org" });
  await assert.rejects(register, { code: "ACCOUNT_INACTIVE", status: 409 });
  user.isActive = true;
  await assert.rejects(register, { message: "Ya existe una cuenta con este correo." });
});

test("reactivar conserva el perfil y requiere la contraseña anterior", async (t) => {
  const transaction = { LOCK: { UPDATE: "UPDATE" } };
  t.mock.method(sequelize, "transaction", async (run) => run(transaction));
  const update = t.mock.fn();
  const passwordHash = await bcrypt.hash("anterior123", 4);
  t.mock.method(Usuario, "findOne", async ({ where, include }) => {
    assert.deepEqual(where, { email: "paciente@example.org", isActive: false });
    assert.equal(include[0].where.code, "consumidor");
    return { passwordHash, update };
  });
  await assert.rejects(reactivateUser("Paciente@example.org", "otraClave"), { status: 401 });
  assert.equal(update.mock.callCount(), 0);
  await reactivateUser("Paciente@example.org", "anterior123");
  assert.deepEqual(update.mock.calls[0].arguments, [
    { isActive: true, resetTokenActive: false }, { transaction },
  ]);
});
