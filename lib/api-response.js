export function successResponse(data, message = 'Success', status = 200) {
  return Response.json({ success: true, message, data }, { status })
}

export function errorResponse(message = 'Error', status = 500, errors = null) {
  const body = { success: false, message }
  if (errors) body.errors = errors
  return Response.json(body, { status })
}

export function paginatedResponse(data, pagination, message = 'Success') {
  return Response.json({ success: true, message, data, pagination })
}

export function buildPagination(total, page, limit) {
  const safeLimit = Math.max(1, Number(limit) || 20)
  const safePage = Math.max(1, Number(page) || 1)
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNext: safePage * safeLimit < total,
    hasPrev: safePage > 1,
  }
}

export async function parseJsonBody(request) {
  try {
    const body = await request.json()
    return { data: body, error: null }
  } catch {
    return {
      data: null,
      error: errorResponse('Invalid JSON request body', 400),
    }
  }
}
