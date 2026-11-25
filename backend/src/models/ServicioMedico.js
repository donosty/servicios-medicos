import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ServicioMedico = sequelize.define(
  "ServicioMedico",
  {
    serviceId: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      autoIncrement: true,
      field: "id_servicio",
    },
    slug: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: "clave",
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: "nombre",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "descripcion",
    },
    catalogTitle: { type: DataTypes.TEXT, field: "titulo_catalogo" },
    catalogDescription: { type: DataTypes.TEXT, field: "descripcion_catalogo" },
    category: { type: DataTypes.TEXT, field: "categoria" },
    symbol: { type: DataTypes.TEXT, field: "simbolo" },
    features: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      field: "caracteristicas",
    },
    catalogOrder: { type: DataTypes.SMALLINT, field: "orden_catalogo" },
    price: { type: DataTypes.DECIMAL(10, 2), field: "precio" },
    iconPath: { type: DataTypes.TEXT, field: "ruta_icono" },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "esta_activo",
    },
    displayOrder: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
      field: "orden_visualizacion",
    },
  },
  {
    tableName: "servicios_medicos",
    timestamps: true,
    createdAt: "creado_en",
    updatedAt: false,
  },
);

export default ServicioMedico;
