import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Clear the session/token by clearing the cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logout berhasil'
    })

    // Clear the admin session cookie
    response.cookies.delete('admin-session')
    response.cookies.delete('user-session')

    return response
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    )
  }
}
