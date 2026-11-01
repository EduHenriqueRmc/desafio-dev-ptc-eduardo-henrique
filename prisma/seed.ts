import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {

  await prisma.planta.deleteMany();

  await prisma.planta.createMany({
    data: [
      { nome: "Costela-de-adão", especie: "Monstera deliciosa", preco: 8990, estoque: 12, luminosidade: "MEIA_SOMBRA", petFriendly: false, regaACadaDias: 7 },
      { nome: "Samambaia", especie: "Nephrolepis exaltata", preco: 4500, estoque: 20, luminosidade: "SOMBRA", petFriendly: true, regaACadaDias: 3 },
      { nome: "Cacto Bola", especie: "Echinopsis calochlora", preco: 2500, estoque: 0, luminosidade: "SOL_PLENO", petFriendly: false, regaACadaDias: 15 },
      { nome: "Violeta-africana", especie: "Saintpaulia ionantha", preco: 3290, estoque: 5, luminosidade: "MEIA_SOMBRA", petFriendly: true, regaACadaDias: 4 },
      { nome: "Espada-de-são-jorge", especie: "Dracaena trifasciata", preco: 6000, estoque: 8, luminosidade: "SOL_PLENO", petFriendly: false, regaACadaDias: 10 },
      { nome: "Jiboia", especie: "Epipremnum aureum", preco: 3500, estoque: 15, luminosidade: "MEIA_SOMBRA", petFriendly: false, regaACadaDias: 5 },
      { nome: "Palmeira-areca", especie: "Dypsis lutescens", preco: 12000, estoque: 0, luminosidade: "MEIA_SOMBRA", petFriendly: true, regaACadaDias: 4 },
      { nome: "Suculenta Echeveria", especie: "Echeveria elegans", preco: 1800, estoque: 30, luminosidade: "SOL_PLENO", petFriendly: true, regaACadaDias: 14 },
    ],
  });
};

main()
  .catch((error) => {
    console.error(error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });