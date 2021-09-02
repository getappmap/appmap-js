import yargs from 'yargs';
import AssertCommand from './command';

yargs.command(AssertCommand).help().argv;
