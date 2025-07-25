#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
    Address, Env, U256
};

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SwapRouter);
    let client = SwapRouterClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    // Test that admin was set by trying to add a pool
    let pool_addr = Address::generate(&env);
    let token_a = Address::generate(&env);
    let token_b = Address::generate(&env);

    client.add_pool(&admin, &pool_addr, &token_a, &token_b, &1000000, &2000000, &30);
    
    let pool_info = client.get_pool(&pool_addr);
    assert!(pool_info.is_some());
    
    let pool = pool_info.unwrap();
    assert_eq!(pool.token_a, token_a);
    assert_eq!(pool.token_b, token_b);
    assert_eq!(pool.reserve_a, 1000000);
    assert_eq!(pool.reserve_b, 2000000);
    assert_eq!(pool.fee_rate, 30);
}

#[test]
fn test_get_amount_out() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SwapRouter);
    let client = SwapRouterClient::new(&env, &contract_id);

    // Test constant product formula
    // Pool: 1000 TokenA, 2000 TokenB, 0.3% fee
    let amount_in = 100u128;
    let reserve_in = 1000u128;
    let reserve_out = 2000u128;
    let fee_rate = 30u32; // 0.3%

    let amount_out = client.get_amount_out(&amount_in, &reserve_in, &reserve_out, &fee_rate);
    
    // With 0.3% fee: effective_input = 100 * 9970 / 10000 = 99.7
    // amount_out = (99.7 * 2000) / (1000 + 99.7) = 199400 / 1099.7 ≈ 181
    assert!(amount_out > 180 && amount_out < 182);
}

#[test]
fn test_calculate_route() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SwapRouter);
    let client = SwapRouterClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let pool_addr = Address::generate(&env);
    let token_a = Address::generate(&env);
    let token_b = Address::generate(&env);

    // Add a pool
    client.add_pool(&admin, &pool_addr, &token_a, &token_b, &1000000, &2000000, &30);

    // Test route calculation
    let route = client.calculate_route(&token_a, &token_b, &100);
    assert!(route.is_some());

    let route = route.unwrap();
    assert_eq!(route.pools.len(), 1);
    assert_eq!(route.tokens.len(), 2);
    assert_eq!(route.pools.get(0).unwrap(), pool_addr);
    assert_eq!(route.tokens.get(0).unwrap(), token_a);
    assert_eq!(route.tokens.get(1).unwrap(), token_b);
}

#[test]
fn test_swap_exact_tokens_for_tokens() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SwapRouter);
    let client = SwapRouterClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let pool_addr = Address::generate(&env);
    let token_a = Address::generate(&env);
    let token_b = Address::generate(&env);
    let user = Address::generate(&env);

    // Add a pool
    client.add_pool(&admin, &pool_addr, &token_a, &token_b, &1000000, &2000000, &30);

    // Create swap parameters
    let swap_params = SwapParams {
        token_a: token_a.clone(),
        token_b: token_b.clone(),
        amount_in: 1000,
        amount_out_min: 1800, // Expect at least 1800 tokens out
        to: user.clone(),
        deadline: env.ledger().timestamp() + 3600, // 1 hour from now
    };

    // Execute swap
    let amount_out = client.swap_exact_tokens_for_tokens(&swap_params);
    
    // Should receive approximately 1996 tokens (minus fees)
    assert!(amount_out >= 1800);
    assert!(amount_out < 2000);
}

#[test] 
#[should_panic(expected = "SwapRouter: INSUFFICIENT_OUTPUT_AMOUNT")]
fn test_swap_slippage_protection() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SwapRouter);
    let client = SwapRouterClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let pool_addr = Address::generate(&env);
    let token_a = Address::generate(&env);
    let token_b = Address::generate(&env);
    let user = Address::generate(&env);

    // Add a pool
    client.add_pool(&admin, &pool_addr, &token_a, &token_b, &1000000, &2000000, &30);

    // Create swap parameters with unrealistic minimum output
    let swap_params = SwapParams {
        token_a,
        token_b,
        amount_in: 1000,
        amount_out_min: 2500, // Unrealistically high expectation
        to: user,
        deadline: env.ledger().timestamp() + 3600,
    };

    // This should panic due to slippage protection
    client.swap_exact_tokens_for_tokens(&swap_params);
}