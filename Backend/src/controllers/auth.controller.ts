/**
Copyright 2024 JasmineGraph Team
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

import { Request, Response } from 'express';
import { HTTP } from '../constants/constants';
import axios from 'axios';
import { getAdminToken } from '../utils/keycloak-admin-token';

const register = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role } = req.body;

  if (!email || !firstName || !lastName || !password) {
    return res.status(422).json({ message: 'Email address, first name, last name, and password are required' });
  }

  try {
    const token = await getAdminToken();

    const response = await axios.post(
      `http://keycloak:8080/admin/realms/jasminegraph/users`,
      {
        username: email,
        email: email,
        firstName: firstName,
        lastName: lastName,
        enabled: true,
        credentials: [{ type: 'password', value: password, temporary: false }],
        attributes: { role: [role] }
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 201) {
      console.log(`[REGISTER] User ${email} created successfully`);
      return res.status(HTTP[200]).json({ firstName: firstName, lastName: lastName, email, role });
    } else {
      console.error(`[REGISTER] Failed to create user ${email}`, response.data);
      return res.status(400).json({ message: `Failed to create user ${email} in Keycloak` });
    }
  } catch (err: any) {
    console.error('[REGISTER] Error:', err.response?.data || err.message);
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    res.status(HTTP[500]).send(`Server error: ${errorDetails}`);
  }
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ message: 'Email and password are required' });
  }

  try {
    const response = await axios.post(
      `http://keycloak:8080/realms/jasminegraph/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: 'jasminegraph-api',
        username: email,
        password: password,
        scope: 'openid profile email'
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token } = response.data;
    console.log('[LOGIN] Tokens received from Keycloak');
    return res.json({ accessToken: access_token, refreshToken: refresh_token });
  } catch (err: any) {
    console.error('[LOGIN] Error:', err.response?.data || err.message);
    if (err.response && err.response.status === 401) {
      return res.status(HTTP[401]).send('Invalid credentials');
    }
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    return res.status(HTTP[500]).send(`Server error: ${errorDetails}`);
  }
};

const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(HTTP[401]).json({ message: 'Refresh token is required' });

  try {
    const response = await axios.post(
      `http://keycloak:8080/realms/jasminegraph/protocol/openid-connect/token`,
      new URLSearchParams({
        client_id: 'jasminegraph-api',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    return res.json({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    });
  } catch (err: any) {
    console.error('[REFRESH TOKEN] Error:', err.response?.data || err.message);
    return res.status(HTTP[401]).json({ message: 'Invalid or expired refresh token' });
  }
};

export { login, register, refreshToken };
