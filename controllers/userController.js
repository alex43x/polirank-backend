import User from "../models/userModel.js"; 

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            order: [['id', 'ASC']]
        });
        return res.json(users);
    } catch (error) {
        console.error("Error al obtener los usuarios:", error);
        res.status(500).send("Error al obtener los usuarios");
    }
};

const getUserbyId = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error al obtener el usuario:", error);
        res.status(500).send("Error al obtener el usuario");
    }
};

const createUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    try {
        const newUser = await User.create({
            name,
            email,
            password
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error("Error al crear el usuario:", error);
        res.status(500).send("Error al crear el usuario");
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    try {
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        await user.update({
            name,
            email
        });

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al actualizar el usuario");
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        await user.destroy();

        res.status(200).json("Usuario eliminado");
    } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        res.status(500).send("Error al eliminar el usuario");
    }
};

export default {
    getAllUsers,
    getUserbyId,
    createUser,
    updateUser,
    deleteUser,
};