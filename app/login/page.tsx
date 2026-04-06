import LoginClient from "./login-client"

export default function LoginPage({
  searchParams,
}: {
  searchParams?: {
    next?: string | string[]
  }
}) {
  const nextParam =
    typeof searchParams?.next === "string"
      ? searchParams.next
      : Array.isArray(searchParams?.next)
      ? searchParams.next[0] || "/dashboard"
      : "/dashboard"

  return <LoginClient nextParam={nextParam} />
}
