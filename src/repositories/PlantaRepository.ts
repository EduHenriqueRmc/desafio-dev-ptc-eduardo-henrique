import { Prisma, Luminosidade } from "@prisma/client";
import prisma from "@database";

export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
    return await prisma.planta.create({
        data: data,
    });
};

export const findAllPlantas = async (filtros: {
    luminosidade?: Luminosidade;
    petFriendly?: boolean;
    nome?: string;
}) => {
    return await prisma.planta.findMany({
        where: {
            luminosidade: filtros.luminosidade,
            petFriendly: filtros.petFriendly,
            nome: 
                filtros.nome === undefined
                    ? undefined
                    : { contains: filtros.nome, mode: "insensitive" },
        },
    });
};

export const findPlantaById = async (id: number) => {
    return await prisma.planta.findUnique({
        where: { id: id }
    });
};

export const updatePlanta = async (id: number, data: Prisma.PlantaUpdateInput) => {
    return await prisma.planta.update({
        where: { id: id },
        data: data,
    });
};

export const deletePlanta = async (id: number) => {
    return await prisma.planta.delete({
        where: { id: id }
    });
};

export const decrementEstoque = async (id: number, quantidade: number) => {
    return await prisma.planta.update({
        where: { id: id },
        data: { estoque: { decrement: quantidade } },
    });
};

export const findAllPrecoEEstoque = async () => {
    return await prisma.planta.findMany({
        select: { preco: true, estoque: true },
    });
};