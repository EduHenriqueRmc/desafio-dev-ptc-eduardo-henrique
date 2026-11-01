import { Request, Response } from "express";
import { Luminosidade } from "@prisma/client";
import * as PlantaRepository from "@repositories/PlantaRepository";

// O controller recebe a requisição, valida os dados, chama o repository
// e decide qual status HTTP e qual corpo devolver.

const validarCampos = (dados: {
  nome?: any;
  especie?: any;
  preco?: any;
  estoque?: any;
  luminosidade?: any;
  petFriendly?: any;
  regaACadaDias?: any;
}): string | null => {
  const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = dados;

  if (nome !== undefined && (typeof nome !== "string" || nome.trim() === "")) {
    return "O nome deve ser um texto não vazio.";
  }

  if (especie !== undefined && (typeof especie !== "string" || especie.trim() === "")) {
    return "A espécie deve ser um texto não vazio.";
  }

  if (preco !== undefined && (!Number.isInteger(preco) || preco <= 0)) {
    return "O preço deve ser um número inteiro maior que zero (em centavos).";
  }

  if (estoque !== undefined && (!Number.isInteger(estoque) || estoque < 0)) {
    return "O estoque deve ser um número inteiro maior ou igual a zero.";
  }

  if (luminosidade !== undefined && !Object.values(Luminosidade).includes(luminosidade)) {
    return "A luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.";
  }

  if (petFriendly !== undefined && typeof petFriendly !== "boolean") {
    return "petFriendly deve ser true ou false.";
  }

  if (regaACadaDias !== undefined && (!Number.isInteger(regaACadaDias) || regaACadaDias < 1)) {
    return "regaACadaDias deve ser um número inteiro de pelo menos 1.";
  }

  return null;
};

export const createPlanta = async (req: Request, res: Response) => {
  try {
    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;

    // 400 Bad Request: o cliente mandou dados incompletos
    if (
      nome === undefined ||
      especie === undefined ||
      preco === undefined ||
      estoque === undefined ||
      luminosidade === undefined ||
      petFriendly === undefined ||
      regaACadaDias === undefined
    ) {
      return res.status(400).json({
        message:
          "Preencha nome, especie, preco, estoque, luminosidade, petFriendly e regaACadaDias.",
      });
    }

    // 400 Bad Request: o cliente mandou dados inválidos
    const erro = validarCampos({ nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias });

    if (erro) {
      return res.status(400).json({ message: erro });
    }

    const planta = await PlantaRepository.createPlanta({
      nome: nome,
      especie: especie,
      preco: preco,
      estoque: estoque,
      luminosidade: luminosidade,
      petFriendly: petFriendly,
      regaACadaDias: regaACadaDias,
    });

    // 201 Created: algo novo foi criado
    return res.status(201).json(planta);
  } catch (error) {
    console.error(error);
    // 500 Internal Server Error: o problema foi nosso, não do cliente
    return res.status(500).json({ message: "Erro ao criar planta." });
  }
};

export const readAllPlantas = async (req: Request, res: Response) => {
  try {
    // Os filtros chegam em req.query e sempre como texto
    const luminosidade = req.query.luminosidade as Luminosidade | undefined;
    const petFriendlyQuery = req.query.petFriendly;
    const nome = req.query.nome;
    const ordem = req.query.ordem;

    if (luminosidade !== undefined && !Object.values(Luminosidade).includes(luminosidade)) {
      return res.status(400).json({
        message: "A luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.",
      });
    }

    if (petFriendlyQuery !== undefined && petFriendlyQuery !== "true" && petFriendlyQuery !== "false") {
      return res.status(400).json({ message: "petFriendly deve ser true ou false." });
    }
    
    if (nome !== undefined && typeof nome !== "string") {
        return res.status(400).json({ message: "O nome deve ser um texto." });
    }

    if (ordem !== undefined && ordem !== "preco" && ordem !== "nome") {
        return res.status(400).json({ message: "A ordem deve ser preco ou nome." });
    }

    // Filtro não enviado continua undefined
    const petFriendly = petFriendlyQuery === undefined ? undefined : petFriendlyQuery === "true";

    // No where do Prisma, valores undefined são ignorados
    const plantas = await PlantaRepository.findAllPlantas({
        luminosidade: luminosidade,
        petFriendly: petFriendly,
        nome: nome,
        ordem: ordem, 
    });

    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar plantas." });
  }
};

export const readPlantaById = async (req: Request, res: Response) => {
  try {
    // O id chega da URL como texto, então convertemos para número
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Id inválido." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    // 404 Not Found: o id não existe
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    return res.status(200).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar planta." });
  }
};

export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Id inválido." });
    }

    const erro = validarCampos({ nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias });

    if (erro) {
      return res.status(400).json({ message: erro });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    // PATCH = atualização parcial: campos não enviados (undefined) não são alterados
    const updatedPlanta = await PlantaRepository.updatePlanta(id, {
      nome: nome,
      especie: especie,
      preco: preco,
      estoque: estoque,
      luminosidade: luminosidade,
      petFriendly: petFriendly,
      regaACadaDias: regaACadaDias,
    });

    return res.status(200).json(updatedPlanta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar planta." });
  }
};

export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Id inválido." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    await PlantaRepository.deletePlanta(id);

    // 204 No Content: deu certo e não há nada para devolver
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao deletar planta." });
  }
};

export const sellPlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { quantidade } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Id inválido." });
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return res.status(400).json({
        message: "A quantidade deve ser um número inteiro maior que zero.",
      });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    // Sem estoque suficiente: 400 e nada é alterado
    if (planta.estoque < quantidade) {
      return res.status(400).json({
        message: `Temos só ${planta.estoque} vasos`,
      });
    }

    const updatedPlanta = await PlantaRepository.decrementEstoque(id, quantidade);

    return res.status(200).json(updatedPlanta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao vender planta." });
  }
};

export const readValorTotalEstoque = async (req: Request, res: Response) => {
  try {
    const plantas = await PlantaRepository.findAllPrecoEEstoque();

    const valorTotalEmCentavos = plantas.reduce(
      (total, planta) => total + planta.preco * planta.estoque,
      0
    );
    const totalDeVasos = plantas.reduce((total, planta) => total + planta.estoque, 0);

    return res.status(200).json({ valorTotalEmCentavos, totalDeVasos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao calcular valor total do estoque." });
  }
};

export const readPlantasEsgotadas = async (req: Request, res: Response) => {
  try {
    const plantas = await PlantaRepository.findAllPlantasEsgotadas();

    // Sem plantas esgotadas: 200 com []
    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar plantas esgotadas." });
  }
};