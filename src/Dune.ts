import { config } from './config'
import { HEADERS, URLS } from './constants'
import { Cookies } from './Cookies'

export class Dune {
  private readonly password: string
  private readonly username: string
  private readonly cookies: Cookies
  private csrf: string | undefined
  private token: string | undefined

  constructor({ password, username } = config) {
    if (password === undefined) throw new Error('Dune password is not defined')
    if (username === undefined) throw new Error('Dune username is not defined')

    this.password = password
    this.username = username
    this.cookies = new Cookies()
  }

  private async getCsrfToken() {
    const response = await fetch(URLS.CSRF, { method: 'POST' })

    this.csrf = (await response.json()).csrf
    this.cookies.set(response)
  }

  private async getAuthCookies() {
    if (this.csrf === undefined) throw new Error('CSRF token is not defined')

    await fetch(URLS.AUTH, {
      body: new URLSearchParams({
        action: 'login',
        csrf: this.csrf,
        next: URLS.BASE,
        password: this.password,
        username: this.username,
      }),
      headers: {
        ...HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie: `csrf=${this.csrf}`,
      },
      method: 'POST',
      redirect: 'manual',
    }).then((res) => {
      this.cookies.set(res)
    })
  }

  private async getAuthToken() {
    if (this.cookies === undefined) throw new Error('cookies are not defined')

    const response = await fetch(URLS.SESSION, {
      body: 'false',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/json',
        cookie: this.cookies.toString(),
      },
      method: 'POST',
    })

    const res = await response.json()
    this.token = res.token
  }

  public async login() {
    await this.getCsrfToken()
    await this.getAuthCookies()
    await this.getAuthToken()
  }
}

export const dune = new Dune()
