import axios from "axios";
import qs from "qs";
import { userRepository } from "../repositories/userRepository";

interface GoogleOAuthTokens {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    id_token: string;
}

interface GoogleUser {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
}

export async function getGoogleOAuthTokens(code: string): Promise<GoogleOAuthTokens> {
    const url = "https://oauth2.googleapis.com/token";

    const values = {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
    };

    try {
        const response = await axios.post<GoogleOAuthTokens>(url, qs.stringify(values), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao obter tokens do Google OAuth:", error);
        throw error;
    }
}

export async function getGoogleUser(id_token: string, access_token: string): Promise<GoogleUser> {
    try {
        const response = await axios.get<GoogleUser>("https://www.googleapis.com/oauth2/v3/userinfo?alt=json&access_token=" + access_token, {
            headers: {
                Authorization: `Bearer ${id_token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao obter usuário do Google:", error);
        throw error;
    }
}

export async function createUser(googleUser: GoogleUser) {
    const user = await userRepository.findOne({
        where: {
            email: googleUser.email,
        },
    });
    
    if (user) {
        return user;
    }

    const newUser = userRepository.create({
        username: googleUser.name,
        email: googleUser.email,
        password: '' // Como é autenticação do Google, não precisamos de senha
    });
    return userRepository.save(newUser);
}
