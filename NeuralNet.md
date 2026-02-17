# Neural Networks From Scratch

> Trigger this skill when an AI agent must implement, explain, or debug neural networks at the fundamental level—building computational graphs without high-level frameworks. This involves translating mathematical theory into working code through manual construction of forward propagation, loss functions, and backpropagation mechanics. Apply when deep understanding of gradient flow, tensor operations, and numerical stability is required rather than framework abstraction.

## Overview

This skill encompasses the complete pipeline for building neural networks from first principles: mastering mathematical foundations (linear algebra, calculus, probability), implementing every computational component manually, and systematically debugging through dimension verification and numerical stability checks. The approach forces direct confrontation with how data flows through layers, how errors propagate backward through the chain rule, and how parameters update via gradient descent. By rejecting framework convenience, practitioners develop intuition for tensor algebra, understand why architectures succeed or fail, and gain the diagnostic ability to identify subtle bugs in gradient computation or numerical overflow.

## When to Use

- Implementing neural network primitives without PyTorch/TensorFlow/JAX dependencies
- Debugging gradient flow issues, vanishing/exploding gradients, or training instabilities
- Teaching or explaining neural network mechanics at the mathematical operation level
- Prototyping novel architectures where framework abstractions hide critical details
- Verifying correctness of custom layer implementations through manual gradient checking
- Building embedded or resource-constrained systems requiring minimal dependencies
- Investigating numerical precision issues, NaN propagation, or optimization failures

## Core Workflow

1. **Mathematical Foundation Phase**: Master linear algebra (matrix multiplication, vector operations, eigenvalues), calculus (partial derivatives, chain rule, gradient computation), and probability theory (likelihood functions, expectation, variance). Understand how these map to neural network operations—matrices as weight transformations, derivatives as learning signals, probability as uncertainty quantification.

2. **Forward Propagation Construction**: Implement layer-by-layer data flow manually. For each layer, code the weighted linear combination `z = W·x + b`, apply nonlinear activation `a = f(z)`, and pass output to subsequent layers. Track tensor shapes religiously—input dimensions must align with weight matrix columns, outputs match rows. Test with tiny datasets (3-5 samples) where expected results can be hand-calculated.

3. **Loss Function Implementation**: Code the error metric by hand—mean squared error for regression, cross-entropy for classification. Ensure output shape matches label shape. Compute scalar loss value that quantifies prediction discrepancy. Verify loss decreases on trivial datasets (same input/output repeated) before scaling up.

4. **Backpropagation Derivation**: Derive gradient equations on paper using chain rule. Start from loss gradient ∂L/∂output, recursively compute ∂L/∂weights and ∂L/∂activations for each layer working backward. Implement gradient computation matching derivations exactly—transpose operations, element-wise multiplications, matrix products in correct order.

5. **Gradient Implementation**: Translate paper derivations into code. For each parameter, compute how loss changes with respect to that parameter. Store gradients in same shape as parameters. Implement gradient descent update rule: `weights -= learning_rate * gradient`. Check gradients numerically: compare analytical gradients against finite difference approximations `(f(x+ε) - f(x-ε))/(2ε)`.

6. **Dimension Verification Loop**: Before every matrix operation, print and verify tensor shapes. Ensure dimensions align: `(batch, input_dim) @ (input_dim, output_dim) → (batch, output_dim)`. Mismatched dimensions cause immediate failures—catch early. Use assertions: `assert activations.shape == (batch_size, layer_width)`.

7. **Numerical Debugging Protocol**: Initialize with small random weights (±0.01) to prevent saturation. Use small learning rates (0.001) initially. Print intermediate values: pre-activation sums, post-activation outputs, gradients at each layer. Test with known-solvable problems (XOR, simple linear regression). Expect NaNs—trace backward to find division by zero, log of negative numbers, or gradient explosion. When NaNs appear, reduce learning rate, add gradient clipping, check activation function ranges.

8. **Iterative Refinement**: Run training loop. Print loss every iteration. Verify loss decreases—if stagnant, gradients may be zero; if exploding, learning rate too high. Fix bugs one at a time. Common issues: wrong matrix transpose, incorrect chain rule application, shape broadcasting errors, forgotten bias terms. Retest after each fix. Compare outputs against framework implementations on identical inputs.

## Key Patterns

### Mathematical-to-Code Translation
Express every operation explicitly. Neuron computation: `z = np.dot(weights, inputs) + bias; activation = sigmoid(z)`. Loss gradient: `dL_dz = activation - target`. Weight gradient: `dL_dW = np.outer(dL_dz, inputs)`. Avoid clever abstractions initially—verbosity aids debugging.

### Shape-First Programming
Declare expected shapes in comments before operations: `# X: (batch, features), W: (features, hidden) → Z: (batch, hidden)`. Use shape assertions after every transformation. Shape mismatches fail fast and loud, preventing silent broadcasting bugs that corrupt gradients.

### Gradient Verification Ritual
Implement numerical gradient checker: perturb each weight slightly, measure loss change, compare against analytical gradient. Run on small networks (5-10 parameters) where discrepancies are obvious. Tolerate 1e-5 relative error; larger gaps indicate backprop bugs.

### Simplified Test Cases
Before full datasets, validate on single-sample, single-layer networks where correct outputs are hand-calculable. Example: 2-input linear neuron with known weights should produce predictable output. If this fails, full network will definitely fail.

### Verbose Debugging Prints
Print everything temporarily: `print(f"Layer2 activation: {a2}, shape {a2.shape}, mean {a2.mean()}, std {a2.std()}")`. Remove after validation. Helps identify where values become unreasonable (>1e6 suggests explosion, all zeros suggests dead neurons).

### Initialization Sensitivity Testing
Try multiple random seeds. If results vary wildly, initialization scheme needs adjustment. Use Xavier/He initialization: scale initial weights by `sqrt(2/n_inputs)` to prevent vanishing/exploding activations in deep networks.

### Activation Function Saturation Monitoring
Print pre-activation values. If sigmoid inputs consistently exceed ±5, gradients near zero (saturation). If ReLU inputs consistently negative, neuron dies. Adjust initialization or add batch normalization.

## Edge Cases & Warnings

- ⚠️ **NaN Propagation**: A single NaN infects all downstream computations. Common sources: `log(0)` in cross-entropy when predictions exactly 0/1, division by zero in normalization, overflow in exponentials. Add epsilon safety: `log(pred + 1e-8)`, clip predictions to `[1e-7, 1-1e-7]`.

- ⚠️ **Gradient Vanishing**: Deep networks with sigmoid/tanh activations multiply many small derivatives (chain rule), causing gradients to approach zero in early layers. Early layers stop learning. Mitigation: use ReLU activations, residual connections, or gradient clipping lower bound.

- ⚠️ **Gradient Explosion**: Large weight initialization or high learning rates cause gradients to compound multiplicatively, producing huge updates that destabilize training. Loss oscillates or becomes NaN. Mitigation: gradient clipping (`np.clip(grad, -1, 1)`), smaller learning rate, better initialization.

- ⚠️ **Broadcasting Disasters**: NumPy/JAX auto-broadcast incompatible shapes, silently creating wrong computations. `(5,1) + (5,)` broadcasts to `(5,5)` instead of intended `(5,1)`. Disable auto-broadcasting mentally; explicitly reshape: `bias.reshape(-1, 1)`.

- ⚠️ **Transposition Confusion**: Matrix multiplication order and transpose placement in backprop are error-prone. Derive dimensions: if forward is `Z = X @ W` where `X:(batch, in)` and `W:(in, out)`, then gradient `dL_dW = X.T @ dL_dZ`. Verify shapes match.

- ⚠️ **Batch vs Single Sample**: Derivations often assume single samples but implementations use batches. Gradients must average over batch: `dL_dW = (1/batch_size) * sum_over_batch(gradients)`. Forgetting normalization causes learning rate to scale with batch size.

- ⚠️ **In-Place Operations**: Modifying arrays used in gradient computation corrupts backprop. `x += delta` overwrites values needed for later gradient calculations. Always copy: `x_new = x + delta`. Track computational graph carefully.

- ⚠️ **Dead ReLU Neurons**: If ReLU inputs are always negative (due to bad initialization or large negative biases), gradient is always zero, neuron never updates. Monitor percentage of activations that are zero; if >50%, reinitialize.

- ⚠️ **Floating Point Precision**: Operations like `exp(x)` overflow for `x > 700` (float64). Softmax requires log-sum-exp trick: `softmax(x) = exp(x - max(x)) / sum(exp(x - max(x)))` to prevent overflow. Use numerically stable formulations.

## Quick Reference

- **Neuron formula**: `output = activation(weights · inputs + bias)`
- **Forward pass**: Iterate layers, apply `activation(linear_transform(input))`
- **Loss functions**: MSE = `mean((pred - true)²)`, CrossEntropy = `-sum(true * log(pred))`
- **Backprop chain rule**: `dL/dW_layer = dL/dOutput_layer · dOutput/dW_layer`
- **Gradient descent**: `W_new = W_old - learning_rate * dL/dW`
- **Shape checking**: `assert A.shape[1] == B.shape[0]` before `A @ B`
- **Gradient verification**: `(f(w+ε) - f(w-ε))/(2ε) ≈ analytical_gradient`
- **Debug print**: `print(f"{var.shape} | min:{var.min()} max:{var.max()} mean:{var.mean()}")`
- **NaN detection**: `assert not np.isnan(array).any()` after each operation
- **Learning rate**: Start 0.001, halve if loss plateaus, reduce 10x if explodes
- **Weight init**: `np.random.randn(n_in, n_out) * sqrt(2/n_in)` for ReLU layers
- **Gradient clipping**: `grad = np.clip(grad, -max_norm, max_norm)`
- **Common shapes**: Input `(batch, features)`, Weights `(features_in, features_out)`, Output `(batch, features_out)`

---
_Generated by Philosopher's Stone v4 — EchoSeed_
Philosopher's Stone v4 × Skill Forge × EchoSeed
