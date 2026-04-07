import type {
  RegisterRequestPayload,
  RegisterResponsePayload,
} from "../type/Auth";

export function toRegisterResponsePayload(
  payload: RegisterRequestPayload,
): RegisterResponsePayload {
  return {
    id: payload.id,
    email: payload.email,
  };
}
