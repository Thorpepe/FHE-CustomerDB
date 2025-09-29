import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;

  const deployment = await deploy("CustomerDB", {
    from: deployer,
    log: true,
  });

  log(`CustomerDB deployed at: ${deployment.address}`);
};

export default func;
func.id = "deploy_customer_db"; // prevent reexecution
func.tags = ["CustomerDB"];

