import itertools
import math

def safe_add(x, y): return x + y
def safe_sub(x, y): return x - y
def safe_mul(x, y): return x * y
def safe_div(x, y): return x / y if y != 0 else None

binary_ops = [
    ('+', safe_add),
    ('-', safe_sub),
    ('*', safe_mul),
    ('/', safe_div),
]

def square_chain(val, expr, depth=2):
    results = [(val, expr)]
    current_val = val
    current_expr = expr
    for _ in range(depth):
        current_val = current_val * current_val
        current_expr = f"({current_expr})^2"
        results.append((current_val, current_expr))
    return results

def root_if_possible(val, expr):
    results = []
    if val >= 0:
        root = math.sqrt(val)
        if root == int(root):
            results.append((int(root), f"√({expr})"))
    return results

def generate_all_exprs(nums):
    if len(nums) == 1:
        val = nums[0]
        expr = str(val)
        result_set = set()
        queue = [(val, expr)]
        while queue:
            v, e = queue.pop()
            if (v, e) in result_set:
                continue
            result_set.add((v, e))
            queue.extend(square_chain(v, e))
            queue.extend(root_if_possible(v, e))
        return list(result_set)

    results = []
    for i in range(1, len(nums)):
        left = nums[:i]
        right = nums[i:]
        left_exprs = generate_all_exprs(left)
        right_exprs = generate_all_exprs(right)

        for lv, le in left_exprs:
            for rv, re in right_exprs:
                for sym, op in binary_ops:
                    try:
                        val = op(lv, rv)
                        if val is None or isinstance(val, complex):
                            continue
                        base_expr = f"({le} {sym} {re})"
                        new_values = square_chain(val, base_expr) + root_if_possible(val, base_expr)
                        new_values.append((val, base_expr))
                        results.extend(new_values)
                    except:
                        continue
    return results

def can_make_all_1_to_19(combo):
    found = set()
    for perm in set(itertools.permutations(combo)):
        exprs = generate_all_exprs(list(perm))
        for val, _ in exprs:
            if abs(val - round(val)) < 1e-6:
                int_val = int(round(val))
                if 1 <= int_val <= 19:
                    found.add(int_val)
    return all(n in found for n in range(1, 20))

all_combos = sorted(set(tuple(sorted(p)) for p in itertools.product(range(1, 7), repeat=3)))
valid_combos = [combo for combo in all_combos if can_make_all_1_to_19(combo)]

print(f"Total valid combinations: {len(valid_combos)}")
for combo in valid_combos:
    print(combo)

