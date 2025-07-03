import itertools
import math

# Binary operations
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

# Apply unary operations to a value + expression
def apply_unary(val, expr):
    results = [(val, expr)]
    squared = val * val
    results.append((squared, f"({expr})^2"))
    if val >= 0:
        root = math.sqrt(val)
        if root == int(root):
            results.append((int(root), f"√({expr})"))
    return results

# Recursively combine numbers with all operator trees
def generate_all_exprs(nums):
    if len(nums) == 1:
        return apply_unary(nums[0], str(nums[0]))
    
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
                        v = op(lv, rv)
                        if v is None: continue
                        results.extend(apply_unary(v, f"({le} {sym} {re})"))
                    except:
                        continue
    return results

# Check if a 3-dice combo can make 1 through 19
def can_make_all_1_to_19(combo):
    found = set()
    for perm in itertools.permutations(combo):
        exprs = generate_all_exprs(list(perm))
        for val, _ in exprs:
            if abs(val - round(val)) < 1e-9:
                found.add(int(round(val)))
    return all(n in found for n in range(1, 20))

all_combos = sorted(set(tuple(sorted(p)) for p in itertools.product(range(1, 7), repeat=3)))
print([combo for combo in all_combos if can_make_all_1_to_19(combo)])
