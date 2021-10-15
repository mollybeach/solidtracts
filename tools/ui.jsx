import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom'
import * as ethers from 'ethers';
import useLocalStorage from 'use-local-storage';
import { getChainByChainId } from 'evm-chains';
import stringify from 'json-stringify-safe';
import styled, { createGlobalStyle } from 'styled-components';
import microtip from 'microtip/microtip.css'
import { X, ChevronRight, Upload, Eye, Edit2, Play } from 'react-feather';

/** Main deployment + network functions */
async function connect() {
	window.ethereum.request({ method: 'eth_requestAccounts' });
}

async function switchChains() {
	window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{chainId: '0x3'}] });
}

async function deploy(spec, name, chainId) {
	const provider = new ethers.providers.Web3Provider(ethereum);
	const factory = new ethers.ContractFactory(spec.abi, spec.evm.bytecode.object, provider.getSigner());
	const contract = await factory.deploy();
	await contract.deployed();

	return { address: contract.address, abi: spec.abi, name, chainId };
}

const GlobalStyles = createGlobalStyle`
	* {
		box-sizing: border-box;
	}
  :root {
		/** color */
    --fg-default: #F5F9FC;
		--fg-dimmer: #C2C8CC;
		--fg-dimmest: #9DA2A6;
		--bg-root: #0E1525;
		--bg-default: #1C2333;
		--bg-higher: #2B3245;
		--bg-highest: #3C445C;
		--outline-default: #70788C;
		--outline-dimmer:  #5F677A;
		--outline-dimmest: #4E5569;
		--overlay: #0e1525A0;

		/**accents */
		--accent-primary-default: #0099FF;
		--accent-primary-dimmer: #0072BD;

		--accent-negative-default: #F23F3F;
		--accent-negative-dimmer: #8F2828;

		--accent-warning-default: #CCAD14;
		--accent-warning-dimmer: #756200;

		/**type */
		--font-family-default: 'IBM Plex Sans', sans-serif;
		--font-family-code: 'IBM Plex Mono', monospace;

		--font-size-header: 24px;
		--font-size-subheader: 18px;
		--font-size-medium: 16px;
		--font-size-default: 14px;
		--font-size-small: 12px;

		/**spacing */
		--space-8: 8px;
		--space-16: 16px;
		--space-32: 32px;

		/**border radius */
		--br-8: 8px;


  }
	* {
		font-family: var(--font-family-default);
		font-size: var(--font-size-default);
	}

	a {
		color: var(--accent-primary-default);
	}
	button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-8);
		font-weight: 500;
		border-radius: var(--br-8);
		outline: none;
		background-color: var(--bg-higher);
		border: 1px solid var(--bg-higher);
		border: none;
		color: white;
		font-size: var(--font-size-default);
		line-height: var(--font-size-default);
		cursor: pointer;
	}
  button:disabled {
    opacity: 0.5;
  }
	button.primary {
		border: 1px solid var(--accent-primary-default);
		background-color: var(--accent-primary-dimmer);
		border: none;
		color: white;
	}
	body {
		padding: 0;
		margin: 0;
		width: 100%;
		min-height: 100vh;
	}

	h1 {
		font-size: var(--font-size-header);
		margin: 0;
		font-weight: 500;
	}

	h2 {
		font-size: var(--font-size-subheader);
		margin: 0;
		font-weight: 500;
	}

	p, span {
		font-size: var(--font-size-default);
	}

	code, pre {
		font-size: var(--font-size-default);
		font-family: var(--font-family-code);
		white-space: pre-wrap;
	}

	.code-error {
		color: var(--accent-negative-default);
	}

	select {
		background: var(--bg-root);
		border: 1px solid var(--outline-default);
		border-radius: var(--br-8);
		padding: var(--space-8);
		color: var(--fg-default);
	}
	select::after {
		margin-right: var(--space-8);
	}
	select:focus, input:focus, button:focus, button:active {
		outline: none;
		border: 1px solid var(--accent-primary-default);
	}
	input {
		background: var(--bg-higher);
		color: var(--fg-default);
		padding: var(--space-8);
		border-radius: var(--br-8);
		border: 1px solid var(--outline-default);
	}
	#root {
		display: flex;
		align-items: center;
		flex-direction: column;
		background-color: var(--bg-root);
		width: 100%;
		height: 100%;
	}
`;

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	background-color: var(--bg-root);
	color: var(--fg-default);
	min-height: 100vh;
	width: 100%;
	max-width: 768px;
	padding: var(--space-16);
`;

const Card = styled.div`
	background-color: var(--bg-default);
`;

const OutlinedButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: var(--space-8);
	borderRadius: var(--br-8)
	font-weight: medium;
	border-radius: var(--br-8);
	border: 1px solid var(--bg-highest);
	background-color: var(--bg-root);
`

const UnstyledButton = styled(OutlinedButton)`
	border: 1px solid transparent;
	background: transparent;
`

const Dot = styled.div`
		background: ${props => props.color};
		width: 6px;
		height: 6px;
		border-radius: 100px;
`

const VStack = styled.div`
	display: flex;
	flex-direction: column;
`
const HStack = styled.div`
	display: flex;
	flex-direction: row;
`

const Overlay = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	position: absolute;
	width: 100%;
	height: 100%;
	background-color: var(--overlay);
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1000;
`

const HelpButton = ({ text, pos, filled }) => {
	return (
		<button style={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			width: '24px',
			height: '24px',
			backgroundColor: filled ? 'var(--bg-higher)' : 'transparent',
			border: '1px solid rgba(255,255,255,0.25)',
			fontFamily: 'var(--font-family-default)',
			borderRadius: '100px'
		}}
			aria-label={text}
			data-microtip-position={pos || 'bottom'}
			role="tooltip"
			data-microtip-size="medium"
		>
			?
		</button>
	)
}

// Copies text to clipboard with a fake input lol
function copy(text) {
	var inp = document.createElement('input');
	inp.style.position = "absolute"
	inp.style.opacity = 0;
	document.body.appendChild(inp)
	inp.value = text
	inp.select();
	document.execCommand('copy', false);
	inp.remove();
}

const Address = ({ address }) => {
	return <OutlinedButton style={{
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		cursor: 'pointer'
	}}
		onClick={() => copy(address)}
		aria-label="Copy wallet address"
		data-microtip-position="bottom"
		role="tooltip"
	>
		<Dot style={{ marginRight: 'var(--space-8)' }} color="lightgreen" />
		<span style={{
			fontFamily: 'var(--font-family-code)',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			width: '80px'
		}}>
			{address}
		</span>
	</OutlinedButton>
}

/** Main app */
export default function App() {
	const walletAddress = useWalletAddress();
	const chainId = useChainId();

	const [contracts, setContracts] = useLocalStorage('contracts', []);
	const [showError, setShowError] = useState(false);
	const [errors, setErrors] = useState(null);

	React.useEffect(() => {
		setShowError(true)
	}, [errors])

	if (typeof window.ethereum === 'undefined') {
		return (
			<div>
				<GlobalStyles />
				<a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">
					Install Metamask
        </a>
			</div>
		);
	}

	// if (!walletAddress) {
	// 	return <button onClick={connect}>Connect wallet</button>
	// }

  console.log(contracts);


	return (
		<Wrapper>
			<GlobalStyles />
			{/* ERROR DIALOG 
			automatically opens on error but can be reopened with the error button
			*/}
			{
				errors && showError ? (
					<Overlay>
						<VStack style={{
							width: '75%',
							maxWidth: '400px',
							backgroundColor: 'var(--bg-default)',
							border: '1px solid var(--outline-default)',
							padding: 'var(--space-16)',
							borderRadius: 'var(--br-8)'
						}}>
							<HStack style={{
								width: '100%',
								justifyContent: 'space-between',
								alignItems: 'center'
							}}>
								<h1>Solidity error</h1>
								<UnstyledButton
									onClick={() => setShowError(false)}
								>
									<X size={16} />
								</UnstyledButton>
							</HStack>
							<pre className="code-error">
								{
									errors.map(e => e.formattedMessage).join('\n\n')
								}
							</pre>
						</VStack>
					</Overlay>
				) : null
			}

			{/* HEADER */}
			<HStack style={{
				width: '100%',
				justifyContent: 'space-between',
				paddingBottom: 'var(--space-32)'
			}}>
				<VStack>
					<HStack style={{ gap: 8, flexWrap: "nowrap", alignItems: "center" }}>
						<h1 style={{ paddingBottom: 'var(--space-8)' }}>Replit 🤝 Ethereum</h1>
					</HStack>
					{
						walletAddress && (
							<ChainInfo chainId={chainId} />
						)
					}
				</VStack>
				{
					walletAddress ? (
						<VStack style={{ alignItems: 'end' }}>
							<HStack style={{ alignItems: 'center', paddingBottom: 'var(--space-8)' }}>
								<Balance style={{ marginRight: 'var(--space-16)' }} chainId={chainId} walletAddress={walletAddress} />
								<Address address={ethers.utils.getAddress(walletAddress)} />
							</HStack>

							<FaucetLink chainId={chainId} />

						</VStack>
					) : (
							<button className="primary" onClick={connect}>Connect wallet</button>
						)
				}
			</HStack>

			{/* DEPLOYMENT */}
			<HStack style={{
				width: '100%',
				alignItems: 'center',
				justifyContent: 'space-between',
				paddingBottom: 'var(--space-16)'
			}}>
				<h2>Deployed contracts</h2>
				{
					walletAddress &&
					<Deployer
						chainId={chainId}
						walletAddress={walletAddress}
						onDeployed={(contract) => setContracts([...contracts, contract])}
						onClickError={() => setShowError(true)}
						onError={(errors) => {
							setErrors(errors);
						}}
					/>
				}
			</HStack>

			{/* CONTRACTS */}
			{
				walletAddress && contracts.length > 0 ? (
					// show new contracts first.
					contracts.slice(0).reverse().filter(c => c.chainId == chainId).map(contract =>
						<ContractUI
							key={contract.address}
							contract={contract}
							onRemove={() => {
								if (confirm("Are you sure you want to remove this contract? It will still exist on the network, but you won't be able to interact with it in this UI anymore.")) {
									setContracts(contracts.slice(0).reverse().filter(c => c !== contract))
								}
							}
							}
						/>
					)
				) : (
						<VStack style={{
							alignItems: 'center',
							justifyContent: 'center',
							width: '100%',
							height: '100%',
							border: '1px solid var(--outline-dimmer)',
							borderRadius: 'var(--br-8)',
							padding: 'var(--space-8)'
						}}>
							<h2 style={{ color: 'var(--fg-default)' }}>gm️</h2>
							<p style={{ color: 'var(--fg-dimmest)' }}>
								no contracts deployed yet
							</p>
						</VStack>
					)
			}

		</Wrapper>
	);
}

function FaucetLink({ chainId }) {
	const { faucets } = getChainByChainId(chainId);
	return (
		faucets.length > 0 ?
			<a target="_blank" rel="noopener" href={faucets[0]}>Get Ether for testing </a> : null
	)
}

function Balance({ walletAddress, chainId }) {
	const balance = useBalance(walletAddress, chainId);
	const { faucets } = getChainByChainId(chainId);

	if (balance === null) {
		return <span>Checking balance...</span>
	}

	return (
		<span style={{ marginRight: 'var(--space-8)', whiteSpace: 'nowrap' }}>
			{ethers.utils.formatEther(balance).slice(0, 4)} ETH
		</span>
	)
}

function ChainInfo({ chainId }) {
	const { name } = getChainByChainId(chainId);

	return (
		<VStack style={{ alignItems: 'start' }}>
			<HStack style={{ alignItems: 'center', gap: '8px' }}>
				<span style={{
					color: chainId === 1 ?
						'var(--accent-warning-default)' :
						'var(--fg-dimmest)'
				}}>
					Connected to {name.replace('Ethereum', '')}
				</span>
				<HelpButton text={
					chainId === 1 ?
						"This is the primary network for Ethereum and uses real Ether for deployment" :
						"Test networks let you deploy your code with fake Ether"
				} />
			</HStack>
			{chainId === 1 &&
				<span style={{
					color: 'var(--accent-warning-dimmer)'
				}}>
					<span onClick={switchChains} style={{
            textDecoration: 'underline',
            textDecorationStyle: 'dashed',
            cursor: 'pointer',
          }}>Switch to a test network</span> for development via 🦊 MetaMask
				</span>
			}
		</VStack>
	);
}

function Deployer({ walletAddress, onDeployed, chainId, onError, onClickError }) {
	const [output, setOutput] = useState(null);
	const [path, setPath] = useState('');
  useEffect(() => {
    setPath((oldPath) => {
      if (!output || output.errors) {
        return oldPath;
      }

      let {file, name} = JSON.parse(path || '{}');
      if (file in output.contracts && name in output.contracts[file]) {
        return oldPath;
      }

      file = Object.keys(output.contracts).sort((a, b) => a.length - b.length)[0];
			name = Object.keys(output.contracts[file])[0];
			return JSON.stringify({ file, name });
    });
  }, [output]);

	useEffect(() => {
		let running = true;
		async function loop() {
      let lastMtime = 0;
			while (running) {
				const res = await fetch('/watch/' + lastMtime);
				const jsn = await res.json();
				if (!jsn.changed) {
					continue;
				}

        console.log(jsn);

        lastMtime = jsn.mtime;
				
				if (jsn.errors) {
					console.info(jsn.errors);
					continue;
				}

				setOutput(jsn.output);
			}
		}

		loop();
		return () => { running = false };
	}, []);

	const { watch, isRunning, error } = useAsyncStatus();

  if (!output) {
    return null;
  }

	// TODO: put this into a modal / tie the button to it
	if (output.errors) {
		onError(output.errors);

		return (
			<OutlinedButton
				onClick={onClickError}
				style={{
					borderColor: 'var(--accent-negative-dimmer)', color: 'var(--accent-negative-default)'
				}}>
				Fix solidity errors to deploy
			</OutlinedButton>
		);
	}

	// TODO: show rejection? 
	// {error && <span style={{ color: 'red' }}>{error.error ?.message || error.message}</span>}

	return (
		<HStack style={{ alignItems: 'stretch' }}>
			<select
				style={{
					borderTopRightRadius: 0,
					borderBottomRightRadius: 0,
				}}
				value={path}
				onChange={e => setPath(e.target.value)}>
				{Object.keys(output.contracts).map(file =>
					<optgroup key={file} label={file}>
						{Object.keys(output.contracts[file]).map(name =>
							<option key={name} value={JSON.stringify({ file, name })}>
								{name}
							</option>
						)}
					</optgroup>
				)}
			</select>
			<button
				style={{
					whiteSpace: 'nowrap',
					borderTopLeftRadius: 0,
					borderBottomLeftRadius: 0,
					border: '1px solid var(--outline-default)',
          padding: '0px 16px',
					gap: 8,
				}}
				disabled={!path || isRunning}
				onClick={() => {
					if (chainId === 1) {
						if (confirm('You are connected to Mainnet, which means your personal ether will be used to deploy your contracts. We recommend switching to a test network in Metamask.')) {
							const { file, name } = JSON.parse(path);
							watch(deploy(output.contracts[file][name], name, chainId)).then(onDeployed)
						}
					} else {
						const { file, name } = JSON.parse(path);
						watch(deploy(output.contracts[file][name], name, chainId)).then(onDeployed)
					}

				}}>
				<Upload size={16} />
				{isRunning ? 'Deploying...' : 'Deploy'}
			</button>
		</HStack>
	);
}

const generalStateMutability = (stateMutability) => {
	if (stateMutability === "payable" || stateMutability === "nonpayable") {
		return "write"
	}

	return "read"
}

function ContractUI({ contract: { name, address, abi }, onRemove }) {
	const [isOpen, setIsOpen] = useState(false);
	// store the last results in memory.
	const [lastResults, setLastResults] = useState({});

	const provider = useMemo(
		() => new ethers.providers.Web3Provider(ethereum),
		[],
	);
	const contractReadOnly = useMemo(
		() => new ethers.Contract(address, abi, provider),
		[address, abi, provider],
	);
	const contractReadWrite = useMemo(
		() => new ethers.Contract(address, abi, provider.getSigner()),
		[address, abi, provider],
	);

	// default to the first function.
	const [selectedFunction, setSelectedFunction] = useState(0)

	window.ccc = contractReadWrite;

	return (
		<VStack style={{
			backgroundColor: isOpen ? 'var(--bg-default)' : 'var(--bg-root)',
			border: '1px solid var(--outline-dimmest)',
			borderRadius: 'var(--br-8)',
			marginBottom: 'var(--space-16)',
			overflow: 'hidden'
		}}
		>
			<HStack style={{
				padding: 'var(--space-8)',
				borderBottom: isOpen ? '1px solid var(--outline-dimmest)' : 'none'
			}}>
				<HStack
					style={{
						alignItems: 'center',
						width: '100%',
						cursor: 'pointer',
						gap: 'var(--space-8)'
					}}
					onClick={() => setIsOpen(!isOpen)}
				>
					<h2>{name}</h2>
					<ChevronRight size={16} style={{
						transform: isOpen ? 'rotate(90deg)' : 'none',
					}} />
				</HStack>
				<UnstyledButton
					onClick={onRemove}
				>
					<X size={16} />
				</UnstyledButton>
			</HStack>

			{/* FUNCTION EXPLORER UI */}
			{isOpen ? (
				<HStack style={{ width: '100%', overflow: 'hidden' }}>
					<VStack style={{ width: "200px", minWidth: "120px" }}>
						{
							abi.map((el, i) => {
								if (el.type === 'function') {
									return (
										<UnstyledButton
											style={{
												borderRadius: 0,
												backgroundColor: i === selectedFunction ? 'var(--bg-highest)' : 'transparent',
												justifyContent: 'space-between',
												alignItems: 'center',
												fontWeight: 400
											}}
											onClick={() => setSelectedFunction(i)}
										>
											<span>{el.name}</span>
											{
												generalStateMutability(el.stateMutability) === "write" ? (
													<Edit2 size={12} />
												) : (
														<Eye size={12} />
													)
											}
										</UnstyledButton>
									)
								}
							})
						}
					</VStack>
					<FunctionUI
						onRun={(val) => setLastResults({ ...lastResults, [selectedFunction]: val })}
						lastResult={lastResults[selectedFunction]}
						contract={contractReadWrite}
						{...abi[selectedFunction]}
					/>
				</HStack>
			) : null}
		</VStack>
	);
}

// Used for tooltips in each function viewer
// Simplify these definitions
const mutabilityStateHelp = {
	payable: "A payable function writes to the contract and requires you to send Ether to the recipient",
	view: "A view function accesses state variables in your contract",
	pure: "A pure function accesses non-state data in your contract",
	nonpayable: "A nonpayable function writes to the contract and does not require you to send Ether to the recipient"
}

const Divider = styled.div`
	background-color: var(--outline-default);
	height: 1px;
	width: 100%;
	margin: var(--space-16) 0;
`

function FunctionUI({ lastResult, onRun, contract, name, inputs, outputs, stateMutability }) {
	const [result, setResult] = useState(null);
	const { watch, isRunning, error } = useAsyncStatus();

	function execute(event) {
		event.preventDefault();
		const data = new FormData(event.target);
		console.log(contract, data, [...data.entries()]);
		let exec;
		if (data.get('__value')) {
			const value = ethers.utils.parseEther(data.get('__value') || '0');
			data.delete('__value');

			exec = contract[name](...data.values(), { value });

		} else {
			exec = contract[name](...data.values());
		}
		watch(exec).then((val) => {
			setResult(val);
			onRun(val);
		});
	}

	const generalState = generalStateMutability(stateMutability);

	// Takes the last result for this given function and formats it to render.
	const formattedResult = () => {
		if (!isRunning && lastResult) {
			if (lastResult.hash) {
				return (
					<VStack style={{ display: 'inline-flex', width: '100%' }}>
						<span style={{ color: 'var(--fg-dimmer)' }}>Transaction hash</span>
						<span
							onClick={() => copy(lastResult.hash)}
							style={{
								display: 'inline-block',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								cursor: 'pointer',
								width: '100%',
								whiteSpace: 'nowrap'
							}}>
							{lastResult.hash}
						</span>
					</VStack>
				)
			} else {
				return (
					<span
						style={{ cursor: 'pointer' }}
						onClick={() => copy(lastResult.toString())}>
						{lastResult.toString()}
					</span>
				)
			}
		}
	}

	return (
		<form style={{
			display: 'flex',
			flexDirection: 'column',
			flex: 2,
			overflow: 'hidden',
			padding: 'var(--space-8)',
			backgroundColor: 'var(--bg-highest)'
		}}
			onSubmit={execute}>

			<HStack style={{
				width: '100%',
				justifyContent: 'space-between',
				alignItems: 'start',
				paddingBottom: 'var(--space-16)'
			}}>

				{/* RUN BUTTON */}
				<VStack>
					<button
						className="primary"
						type="submit"
						style={{ gap: 4, whiteSpace: "nowrap", width: "64px" }}>
						<Play size={16} />
						Run
					</button>
					{stateMutability === 'nonpayable' ? <span style={{ fontSize: 'var(--font-size-small)', padding: 4, color: 'var(--accent-warning-default)' }}>Requires gas</span> : null}
				</VStack>

				{/* FUNCTION STATE EXPLANATION */}
				<span style={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					whiteSpace: 'nowrap',
					gap: 4
				}}>
					{generalState === "write" ? (
						<Edit2 size={12} />) : (<Eye size={12} />)}
					{generalState} •
						<span style={{ opacity: 0.5 }}>{stateMutability}</span>
					<HelpButton text={mutabilityStateHelp[stateMutability]} pos="bottom-left" />
				</span>
			</HStack>

			{/* INPUTS */}
			<VStack style={{ padding: 4, }}>
				<VStack style={{ gap: 'var(--space-8)' }}>
					{
						inputs.length > 0 ? (
							inputs.map(input =>
								<VStack style={{ gap: 4 }}>
									<HStack style={{ gap: 4, alignItems: 'center' }}>
										<span style={{ fontWeight: 500 }}>
											{`${input.name}:`}
										</span>
										<span style={{ color: 'var(--fg-dimmer)' }}>{`${input.type}`}</span>
									</HStack>
									<input type="text" name={input.name} placeholder={`Enter a value for ${input.name}`} />
								</VStack>
							)
						) :
							<span style={{ color: 'var(--fg-dimmest)' }}>No inputs</span>
					}
					{stateMutability === 'payable' && <input type="text" name="__value" placeholder="amount of Ether to pay" />}
				</VStack>


				<Divider />

				{/* OUTPUT */}
				<VStack style={{ gap: 4 }}>
					<span style={{ fontWeight: 500 }}>Last Output</span>

					<div style={{
						width: '100%',
						overflow: 'scroll-y',
						padding: 'var(--space-8)',
						borderRadius: 'var(--br-8)',
						border: '1px solid var(--outline-default)',
					}}>
						{
							lastResult || error ? (
								<VStack>
									{formattedResult()}
									{isRunning && <span>Running</span>}
									{error && <span style={{ color: 'var(--accent-negative-default)' }}>{error.message}</span>}
								</VStack>
							) : (
									<span style={{ color: 'var(--fg-dimmer)' }}>
										Output will appear here after running
                  </span>
								)
						}
					</div>
				</VStack>
			</VStack>
		</form>
	)
}

function useWalletAddress() {
  const {ethereum} = window;
	const [address, setAddress] = useState(ethereum && ethereum.selectedAddress);

	useEffect(() => {
		const onAddressChanged = (addresses) => setAddress(addresses[0]);
		ethereum && ethereum.on('accountsChanged', onAddressChanged);
		return () => {
			ethereum && ethereum.removeListener('accountsChanged', onAddressChanged);
		};
	}, []);

	return address;
}

function useBalance(address, chainId) {
	const [balance, setBalance] = useState(null);

	useEffect(() => {
		let fetchedBalance = setBalance;
		const provider = new ethers.providers.Web3Provider(ethereum);
		provider.getBalance(address).then(fetchedBalance);
		return () => { fetchedBalance = null };
	}, [address, chainId]);

	return balance;
}

function useChainId() {
  const {ethereum} = window;
	const [chainId, setChainId] = useState(ethereum && ethereum.chainId || '1');

	useEffect(() => {
		ethereum && ethereum.on('chainChanged', setChainId);
		return () => {
			ethereum && ethereum.removeListener('chainChanged', setChainId);
		}
	}, []);

	return parseInt(chainId);
}

function useAsyncStatus() {
	const [isRunning, setIsRunning] = useState(false);
	const [error, setError] = useState(null);

	const watch = useCallback((promise) => {
		setIsRunning(true);
		setError(null);

		return promise.then(
			(result) => {
				setIsRunning(false);
				return result;
			},
			(err) => {
				setError(err);
				setIsRunning(false);
				throw err;
			}
		);

	}, []);

	return { watch, isRunning, error };
}


ReactDOM.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
	document.getElementById('root')
)
