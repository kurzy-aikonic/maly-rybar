export type UserState = {
  isPremium: boolean;
  childAge?: number;
};

export const userStore = {
  createInitialUser(): UserState {
    return { isPremium: false };
  },

  setPremium(state: UserState, value: boolean): UserState {
    return { ...state, isPremium: value };
  },

  setChildAge(state: UserState, age: number): UserState {
    return { ...state, childAge: age };
  }
};
