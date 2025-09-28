import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedCustomerDB = await deploy("CustomerDB", {
    from: deployer,
    log: true,
  });

  console.log(`CustomerDB contract: `, deployedCustomerDB.address);
};
export default func;
func.id = "deploy_customerDB"; // id required to prevent reexecution
func.tags = ["CustomerDB"];